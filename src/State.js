export const state = {
    zoomed: false,
    animating: false,
    quizMode: false,
    score: 0,
    currentQuestion: null,
    hovered: null,
    processingAnswer: false // Prevent score farming
};

export function resetState() {
    state.zoomed = false;
    state.animating = false;
    state.quizMode = false;
    state.score = 0;
    state.currentQuestion = null;
    state.hovered = null;
    state.processingAnswer = false;
}
