import "@testing-library/jest-dom";

// JSDOM has no top-layer dialog API. Test component state here; browser QA
// verifies native modality/inert background using Chrome's actual implementation.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}
