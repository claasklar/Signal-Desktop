/* global Whisper, getAccountManager, i18n, $ */

/* eslint-disable more/no-then */

// eslint-disable-next-line func-names
(function () {
  window.Whisper = window.Whisper || {};

  Whisper.ManageDevicesView = Whisper.View.extend({
    template: () => $('#manageDevices').html(),
    className: 'full-screen-flow',
    initialize() {
      this._outer_render();
    },
    _outer_render() {
      Whisper.View.prototype.render.call(this);
      this.render();
    },
    render() {
      const accountManager = getAccountManager();
      if (!accountManager.isStandaloneDevice()) {
        this.$('.button').hide();
      }
      accountManager.getDevices().then(devices => {
        devices.forEach(device => {
          device.name.then(name => {
            const deviceModel = new Whisper.Device({
              id: device.id,
              name,
              accountManager,
            });
            deviceModel.on('removeDevice', this.render);
            const deviceListRow = new Whisper.DeviceListRowView({
              model: deviceModel,
            });
            this.$('#linkedDevicesTable').append(deviceListRow.el);
          });
        });
      });
    },
    render_attributes() {
      return {
        linkedDevices: i18n('linkedDevices'),
        linkNewDevice: i18n('linkNewDevice'),
      };
    },
    events: {
      'click .close': 'onClose',
      'click .button': 'onAddNewDevice',
    },
    onAddNewDevice() {
      Whisper.events.trigger('addDevice');
    },
    onClose() {
      this.$el.trigger('openInbox');
    },
  });
})();
