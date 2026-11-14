export const state = {
    zoomed: false,
    animating: false,
    hovered: null
};

export function resetState() {
    state.zoomed = false;
    state.animating = false;
    state.hovered = null;
}
