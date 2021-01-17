/* global Backbone, Whisper */

// eslint-disable-next-line func-names
(function () {
  window.Whisper = window.Whisper || {};

  Whisper.Device = Backbone.Model.extend({
    storeName: 'device',
    defaults() {
      return {
        id: 0,
        name: undefined,
      };
    },
  });
})();
