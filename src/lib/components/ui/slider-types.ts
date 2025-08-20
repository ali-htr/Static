// Strong typing for your slide objects
export interface Slide {
  id: string | number;

  // Background options
  background?: {
    type?: "color" | "image";   // background type
    color?: string;             // e.g. "#111827"
    imageUrl?: string;          // e.g. "/hero.jpg"
    position?: string;          // e.g. "center center"
    size?: "cover" | "contain" | "auto";
    overlayColor?: string;      // rgba/hex for overlay
    overlayOpacity?: number;    // 0..1
    kenBurns?: boolean;         // enable slow zoom/pan
  };

  // Content
  title?: string;
  description?: string;

  // CTA button
  button?: {
    text: string;
    url: string;
    newTab?: boolean;
    rel?: string;
  };

  // Positioning & text alignment
  contentPosition?:
    | "top-left" | "top-center" | "top-right"
    | "center-left" | "center-center" | "center-right"
    | "bottom-left" | "bottom-center" | "bottom-right";
  textAlign?: "left" | "center" | "right";
}
