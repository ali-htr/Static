<!-- <script>
    import { onMount } from "svelte";
    import pkg from "@googlemaps/js-api-loader";
    const { Loader } = pkg;

    // === Core Props ===
    export let apiKey = ""; // Google Maps API Key
    export let locations = []; // [{ address: "Tehran, Iran", title: "Office", description: "Main branch" }]
    export let zoom = 10;
    export let height = "400px";
    export let scrollWheel = false; // disable scroll zoom

    // === Map Controls ===
    export let zoomControl = true;
    export let streetViewControl = false;
    export let mapTypeControl = true;
    export let fullscreenControl = true;

    // === Map Styling ===
    export let mapType = "roadmap"; // roadmap | satellite | hybrid | terrain
    export let customMapStyle = null; // JSON string OR JS object
    export let cssFilter = ""; // example: "grayscale(100%) contrast(120%)"

    // === Info Window Styling ===
    export let infoWindowBackgroundColor = "#fff";
    export let infoWindowTitleColor = "#000";
    export let infoWindowTitleTypography = {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontWeight: "bold",
    };
    export let infoWindowDescriptionColor = "#333";
    export let infoWindowDescriptionTypography = {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontWeight: "normal",
    };
    export let infoWindowMaxWidth = 250;

    // === Class Props ===
    export let containerClass = "w-full";
    export let mapClass = "rounded-lg shadow-md";

    let mapElement;
    let map;

    onMount(async () => {
        if (!apiKey) {
            console.error("Google Maps API key is required");
            return;
        }


        const loader = new Loader({
            apiKey,
            version: "weekly",
            libraries: ["places"],
        });

        const google = await loader.load();

        let mapStyles = null;
        if (customMapStyle) {
            try {
                mapStyles =
                    typeof customMapStyle === "string"
                        ? JSON.parse(customMapStyle)
                        : customMapStyle;
            } catch (err) {
                console.error("Invalid customMapStyle JSON:", err);
            }
        }


        map = new google.maps.Map(mapElement, {
            zoom,
            mapTypeId: mapType,
            zoomControl,
            streetViewControl,
            mapTypeControl,
            fullscreenControl,
            scrollwheel: scrollWheel,
            styles: mapStyles,
        });


        const geocoder = new google.maps.Geocoder();
        let firstLocationSet = false;

        for (const loc of locations) {
            if (!loc || !loc.address) continue;

            if (typeof loc.address === "string") {
 
                geocoder.geocode(
                    { address: loc.address },
                    (results, status) => {
                        if (status === "OK" && results[0]) {
                            placeMarker(
                                results[0].geometry.location,
                                loc,
                                google,
                            );
                            if (!firstLocationSet) {
                                map.setCenter(results[0].geometry.location);
                                firstLocationSet = true;
                            }
                        } else {
                            console.error("Geocode failed:", status);
                        }
                    },
                );
            } else if (loc.address?.lat && loc.address?.lng) {
 
                const position = new google.maps.LatLng(
                    loc.address.lat,
                    loc.address.lng,
                );
                placeMarker(position, loc, google);
                if (!firstLocationSet) {
                    map.setCenter(position);
                    firstLocationSet = true;
                }
            }
        }
    });

    function placeMarker(position, loc, google) {
        const marker = new google.maps.Marker({
            position,
            map,
            title: loc.title || "",
        });

        if (loc.title || loc.description) {
            const content = `
                <div style="background:${infoWindowBackgroundColor};padding:10px;max-width:${infoWindowMaxWidth}px;">
                  <h3 style="margin:0;color:${infoWindowTitleColor};
                    font-family:${infoWindowTitleTypography.fontFamily};
                    font-size:${infoWindowTitleTypography.fontSize};
                    font-weight:${infoWindowTitleTypography.fontWeight};">
                    ${loc.title || ""}
                  </h3>
                  <p style="margin-top:5px;color:${infoWindowDescriptionColor};
                    font-family:${infoWindowDescriptionTypography.fontFamily};
                    font-size:${infoWindowDescriptionTypography.fontSize};
                    font-weight:${infoWindowDescriptionTypography.fontWeight};">
                    ${loc.description || ""}
                  </p>
                </div>
            `;
            const infoWindow = new google.maps.InfoWindow({ content });
            marker.addListener("click", () => infoWindow.open(map, marker));
        }
    }
</script>


<div class={containerClass} style="height:{height}; filter:{cssFilter};">
    <div
        bind:this={mapElement}
        class={mapClass}
        style="height:100%; width:100%;"
    ></div>
</div>
 -->