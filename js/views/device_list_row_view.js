/* global Whisper, i18n */

// eslint-disable-next-line func-names
(function() {
  window.Whisper = window.Whisper || {};

  Whisper.DeviceListRowView = Whisper.View.extend({
    templateName: 'deviceListRow',
    initialize() {
      this._outer_render();
    },
    _outer_render() {
      Whisper.View.prototype.render.call(this);
      this.render();
    },
    render() {
      if (!this.model.get('accountManager').isStandaloneDevice()) {
        this.$('.tableButton').hide();
      }
    },
    render_attributes() {
      return {
        name: this.model.get('name'),
        deleteLabeln: i18n("delete")
      };
    },
    events: {
      'click .tableButton': 'onDelete',
    },
    async onDelete() {
      const accountManager = this.model.get('accountManager');
      await accountManager.removeDevice(this.model.get('id'));
      this.model.trigger('removeDevice');
    },
  });
})();
