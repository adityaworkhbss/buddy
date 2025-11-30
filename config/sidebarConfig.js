/**
 * Sidebar Configuration
 * 
 * To change the sidebar position, simply modify the 'position' value below.
 * 
 * Available positions:
 * - "left"  : Sidebar on the left side (default)
 * - "right" : Sidebar on the right side
 * - "top"   : Sidebar at the top (horizontal layout)
 * - "bottom": Sidebar at the bottom (horizontal layout)
 * 
 * The layout will automatically adjust:
 * - For "left" or "right": Sidebar uses 'width' setting
 * - For "top" or "bottom": Sidebar uses 'height' setting and displays horizontally
 * 
 * All page components will automatically fit in the remaining space without overflow.
 */

export const sidebarConfig = {
    position: "left", // Options: "left" | "right" | "top" | "bottom"
    
    // You can use either fixed units (rem, px) or percentages (%)
    // Examples: "16rem", "250px", "15%" (15% of screen width/height)
    width: "15%",     // Width for left/right positions (vertical sidebar)
    height: "10%",    // Height for top/bottom positions (horizontal sidebar)
    
    // Alternative: Use fixed units if you prefer
    // width: "16rem",   // Fixed width in rem
    // height: "4rem",   // Fixed height in rem
    
    collapsible: true,
    defaultOpen: true,
};

