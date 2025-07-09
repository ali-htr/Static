import fs from 'fs';
import path from 'path';

let previousUsedClasses = {
    tx: new Set(),
    txs: new Set()
};

const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
};

const statePrefixes = {
    'hover:': { selector: s => `${s}:hover` },
    'focus:': { selector: s => `${s}:focus` },
    'active:': { selector: s => `${s}:active` },
    'visited:': { selector: s => `${s}:visited` },
    'disabled:': { selector: s => `${s}:disabled` },
    'focus-within:': { selector: s => `${s}:focus-within` },
    'group-hover:': { selector: s => `.group:hover ${s}` },
    'peer-focus:': { selector: s => `.peer:focus ~ ${s}` },
    'dark:': { selector: s => `.dark ${s}` },
};

const responsivePrefixes = ['sm:', 'md:', 'lg:'];

/**
 * NEW: Iteratively parses a class name to extract all prefixes.
 * @param {string} classNameWithPrefix The full class name, e.g., "!dark:hover:md:txs-p-4"
 * @returns {{isImportant: boolean, responsivePrefix: string, statePrefixes: string[], baseClassName: string}}
 */
function parseClassName(classNameWithPrefix) {
    let isImportant = false;
    let responsivePrefix = '';
    const foundStatePrefixes = [];
    let baseClassName = classNameWithPrefix;

    if (baseClassName.startsWith('!')) {
        isImportant = true;
        baseClassName = baseClassName.substring(1);
    }

    let prefixFoundInLoop = true;
    while (prefixFoundInLoop) {
        prefixFoundInLoop = false;
        
        // Check for a single responsive prefix
        if (!responsivePrefix) {
            for (const p of responsivePrefixes) {
                if (baseClassName.startsWith(p)) {
                    responsivePrefix = p.slice(0, -1);
                    baseClassName = baseClassName.substring(p.length);
                    prefixFoundInLoop = true;
                    break;
                }
            }
        }
        if (prefixFoundInLoop) continue; // Restart loop to ensure correct order

        // Check for multiple state prefixes
        for (const key in statePrefixes) {
            if (baseClassName.startsWith(key)) {
                foundStatePrefixes.push(key);
                baseClassName = baseClassName.substring(key.length);
                prefixFoundInLoop = true;
                break;
            }
        }
    }

    return { isImportant, responsivePrefix, statePrefixes: foundStatePrefixes, baseClassName };
}


/**
 * NEW: Builds a complex CSS selector from an array of state prefixes.
 * @param {string} escapedClassName The base escaped class name.
 * @param {string[]} prefixes The array of state prefixes, e.g., ['dark:', 'group-hover:']
 * @returns {string} The final CSS selector.
 */
function buildSelector(escapedClassName, prefixes) {
    let selector = `.${escapedClassName}`;
    // Build from the inside out
    for (const prefixKey of prefixes) {
        if (statePrefixes[prefixKey]) {
            selector = statePrefixes[prefixKey].selector(selector);
        }
    }
    return selector;
}


export default function txPlugin(fileExtensions) {
    let initialRun = true;
    return {
        name: 'tx-plugin',
        buildStart() {
            if (initialRun) {
                console.log("Initial app.css compilation on server start...");
                compileAppCss(fileExtensions, null, previousUsedClasses);
                initialRun = false;
            }
        },
        handleHotUpdate(ctx) {
            const changedFile = ctx.file;
            if (fileExtensions.includes(path.extname(changedFile).slice(1))) {
                console.log(`Hot reload detected for file: ${changedFile}`);
                compileAppCss(fileExtensions, null, previousUsedClasses);
            } else {
                console.log(`File changed, but not a relevant extension, skipping app.css update: ${changedFile}`);
            }
        },
    };
}

async function compileAppCss(fileExtensions, changedFile = null, previousClassesState) {
    let baseCssPath = './base.css';
    let appCssPath = './src/routes/app.css';
    let spacingUnit = 'var(--tx)';

    try {
        let baseCssContent = fs.readFileSync(baseCssPath, 'utf-8');
        let baseCssRules = parseBaseCss(baseCssContent);
        let rootVariables = mergeRootVariables(baseCssContent);

        let currentUsedTxClasses = new Set();
        let currentUsedTxsClasses = new Set();

        let filesToProcess = changedFile ? [changedFile] : findFilesInDirectory('.', fileExtensions);
        console.log(changedFile ? `Processing only changed file: ${changedFile}` : `Processing all files for initial app.css generation.`);
        
        let baseCssClasses = extractClassesFromCss(baseCssContent);

        for (let file of filesToProcess) {
            let fileContent = fs.readFileSync(file, 'utf-8');
            let classes = extractClassesFromFileContent(fileContent);

            for (let classNameWithPrefix of classes) {
                // Simplified check: if it contains 'txs-', it's for the txs-generator. Otherwise, check if it's a known tx- class.
                if (classNameWithPrefix.includes('txs-')) {
                    currentUsedTxsClasses.add(classNameWithPrefix);
                } else {
                    const { baseClassName } = parseClassName(classNameWithPrefix);
                    if (baseCssClasses.has(baseClassName)) {
                        currentUsedTxClasses.add(classNameWithPrefix);
                    }
                }
            }
        }

        let appCssContent = rootVariables + '\n\n';

        appCssContent += generateTxClassRules(currentUsedTxClasses, baseCssRules);
        appCssContent += `\n@media (max-width: 767px) {\n    :root {\n        --tx-canvas-size: 420;\n    }\n}\n`;
        appCssContent += generateTxsClassRules(currentUsedTxsClasses, spacingUnit);

        const txClassesChanged = !setsAreEqual(currentUsedTxClasses, previousClassesState.tx);
        const txsClassesChanged = !setsAreEqual(currentUsedTxsClasses, previousClassesState.txs);

        if (!changedFile || txClassesChanged || txsClassesChanged) {
            fs.writeFileSync(appCssPath, appCssContent.trim() || '/* app.css is empty because no tx- or txs- classes were detected */');
            console.log(`Successfully compiled app.css${changedFile ? ' due to hot reload.' : ' on initial run.'}`);
            previousClassesState.tx = currentUsedTxClasses;
            previousClassesState.txs = currentUsedTxsClasses;
        } else {
            console.log('No changes in relevant classes detected, app.css not updated.');
        }

    } catch (error) {
        console.error('Error compiling app.css:', error);
    }
}

// REFACTORED: Now uses the new parsing and selector-building helpers.
function generateTxClassRules(currentUsedTxClasses, baseCssRules) {
    let rules = '';
    currentUsedTxClasses.forEach(classNameWithPrefix => {
        const { isImportant, responsivePrefix, statePrefixes, baseClassName } = parseClassName(classNameWithPrefix);

        if (baseCssRules.has(baseClassName)) {
            let baseRule = baseCssRules.get(baseClassName).split('{')[1].trim();
            let ruleContent = '';
            baseRule.split(';').filter(r => r.trim() !== '').forEach(r => {
                ruleContent += `  ${r.trim()}${isImportant ? ' !important' : ''};\n`;
            });

            const escapedClassName = classNameWithPrefix.replace(/:/g, '\\:').replace(/!/g, '\\!');
            const finalSelector = buildSelector(escapedClassName, statePrefixes);
            const ruleBlock = `${finalSelector} {\n${ruleContent}}`;

            if (responsivePrefix) {
                rules += `@media (min-width: ${breakpoints[responsivePrefix]}) {\n  ${ruleBlock}\n}\n`;
            } else {
                rules += `${ruleBlock}\n`;
            }
        }
    });
    return rules;
}

// REFACTORED: Now uses the new parsing helper.
function generateTxsClassRules(txsClasses, spacingUnit) {
    let rules = '';
    const valueRegex = /^txs-(mr|mx|my|ml|fs|mt|mb|p|rounded|pt|top|bottom|left|right|pb|pl|pr|px|py|gap|w|h|min-w|max-w|min-h|max-h|op|border|bw|z|order|flex-basis|scale|translate-x|translate-y|rotate|skew-x|skew-y)-(\d+)$/;

    txsClasses.forEach(classNameWithPrefix => {
        const { isImportant, responsivePrefix, statePrefixes, baseClassName } = parseClassName(classNameWithPrefix);
        const match = baseClassName.match(valueRegex);
        
        if (match) {
            const baseRule = generateSingleTxsRule(match, spacingUnit, classNameWithPrefix, isImportant, statePrefixes);
            if (responsivePrefix) {
                rules += `@media (min-width: ${breakpoints[responsivePrefix]}) {\n  ${baseRule}\n}\n`;
            } else {
                rules += baseRule;
            }
        }
    });
    return rules;
}

// REFACTORED: Now accepts an array of state prefixes and uses buildSelector.
function generateSingleTxsRule(match, spacingUnit, classNameWithPrefix, isImportant, statePrefixes) {
    let ruleContent = '';
    const prefix = match[1];
    const value = match[2];
    let cssValue = `calc(${spacingUnit} * ${parseInt(value, 10)})`;
    let cssProperty = '';
    let unit = '';
    
    const escapedClassName = classNameWithPrefix.replace(/:/g, '\\:').replace(/!/g, '\\!');
    const selector = buildSelector(escapedClassName, statePrefixes);
    const importantSuffix = isImportant ? ' !important' : '';

    switch (prefix) {
        case 'mr': cssProperty = 'margin-right'; break;
        case 'ml': cssProperty = 'margin-left'; break;
        case 'mt': cssProperty = 'margin-top'; break;
        case 'mb': cssProperty = 'margin-bottom'; break;
        case 'mx': cssProperty = 'margin'; break;
        case 'my': cssProperty = 'margin'; break;
        case 'top': cssProperty = 'top'; break;
        case 'bottom': cssProperty = 'bottom'; break;
        case 'left': cssProperty = 'left'; break;
        case 'right': cssProperty = 'right'; break;
        case 'p': cssProperty = 'padding'; break;
        case 'pt': cssProperty = 'padding-top'; break;
        case 'pb': cssProperty = 'padding-bottom'; break;
        case 'pl': cssProperty = 'padding-left'; break;
        case 'pr': cssProperty = 'padding-right'; break;
        case 'px': cssProperty = 'padding'; break;
        case 'py': cssProperty = 'padding'; break;
        case 'gap': cssProperty = 'gap'; break;
        case 'w': cssProperty = 'width'; break;
        case 'fs': cssProperty = 'font-size'; break;
        case 'rounded': cssProperty = 'border-radius'; break;
        case 'h': cssProperty = 'height'; break;
        case 'min-w': cssProperty = 'min-width'; break;
        case 'max-w': cssProperty = 'max-width'; break;
        case 'min-h': cssProperty = 'min-height'; break;
        case 'max-h': cssProperty = 'max-height'; break;
        case 'border': cssProperty = 'border-width'; unit = 'px'; break;
        case 'bw': cssProperty = 'border-width'; unit = 'px'; break;
        case 'flex-basis': cssProperty = 'flex-basis'; break;
        case 'scale': cssProperty = 'scale';  cssValue = value; break;
        case 'translate-x': cssProperty = 'transform'; cssValue = `translateX(${cssValue})`; break;
        case 'translate-y': cssProperty = 'transform'; cssValue = `translateY(${cssValue})`; break;
        case 'rotate': cssProperty = 'transform'; unit = 'deg'; cssValue = value; break;
        case 'skew-x': cssProperty = 'transform'; cssValue = `skewX(${value}deg)`; unit = ''; break;
        case 'skew-y': cssProperty = 'transform'; cssValue = `skewY(${value}deg)`; unit = ''; break;
        case 'op': cssProperty = 'opacity'; cssValue = (parseInt(value, 10) / 100).toFixed(2);  break;
        case 'z': cssProperty = 'z-index';  cssValue = value; break;
        case 'order': cssProperty = 'order';  cssValue = value; break;
        default: return '';
    }

    if (['translate-x', 'translate-y', 'skew-x', 'skew-y'].includes(prefix)) {
        ruleContent = `  ${cssProperty}: ${cssValue}${importantSuffix};\n`;
    } else if (['px', 'mx'].includes(prefix)) {
        ruleContent = `  ${cssProperty}-left: ${cssValue}${unit}${importantSuffix};\n  ${cssProperty}-right: ${cssValue}${unit}${importantSuffix};\n`;
    } else if (['py', 'my'].includes(prefix)) {
        ruleContent = `  ${cssProperty}-top: ${cssValue}${unit}${importantSuffix};\n  ${cssProperty}-bottom: ${cssValue}${unit}${importantSuffix};\n`;
    } else {
        ruleContent = `  ${cssProperty}: ${cssValue}${unit}${importantSuffix};\n`;
    }

    return `${selector} {\n${ruleContent}}`;
}

// --- Helper Functions (Unchanged) ---
function mergeRootVariables(cssContent) {
    const rootRegex = /:root\s*\{([^}]+)\}/g;
    let mergedVariables = '';
    let match;
    while ((match = rootRegex.exec(cssContent)) !== null) {
        mergedVariables += match[1].trim() + '\n';
    }
    return mergedVariables ? `:root {\n${mergedVariables.trim()}\n}` : '';
}

function setsAreEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (let item of set1) {
        if (!set2.has(item)) return false;
    }
    return true;
}

function parseBaseCss(cssContent) {
    let rulesMap = new Map();
    const regex = /\.([\w-]+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(cssContent)) !== null) {
        rulesMap.set(match[1], `.${match[1]} {\n${match[2].trim()}\n}`);
    }
    return rulesMap;
}

function findFilesInDirectory(dir, extensions, fileList = []) {
    for (let file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFilesInDirectory(filePath, extensions, fileList);
        } else if (extensions.includes(path.extname(file).slice(1))) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function extractClassesFromFileContent(fileContent) {
    const classNames = new Set();
    const regex = /class=["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
        match[1].split(/\s+/).forEach(cls => cls && classNames.add(cls));
    }
    return classNames;
}

function extractClassesFromCss(cssContent) {
    const classNames = new Set();
    const regex = /\.([\w-]+)/g;
    let match;
    while ((match = regex.exec(cssContent)) !== null) {
        classNames.add(match[1]);
    }
    return classNames;
}