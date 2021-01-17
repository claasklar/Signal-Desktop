/* global Whisper, getAccountManager, i18n, textsecure */

/* eslint-disable more/no-then */

// eslint-disable-next-line func-names
(function () {
  window.Whisper = window.Whisper || {};

  Whisper.AddDeviceView = Whisper.View.extend({
    templateName: 'addDevice',
    className: 'full-screen-flow',
    initialize() {
      this.$('statusMessage').hide();
      this.render();
    },
    render_attributes() {
      return {
        linkNewDevice: i18n('linkNewDevice'),
        linkNewDeviceButton: i18n('linkNewDeviceButton'),
        deviceIdentifier: i18n('deviceIdentifier'),
        deviceKey: i18n('deviceKey'),
      };
    },
    events: {
      'click #addDeviceButton': 'onAdd',
      'click .x': 'onClose',
    },
    onAdd() {
      this.$('.statusMessage').hide();
      this.$('.statusMessage').removeClass('success error');
      const accountManager = getAccountManager();
      const deviceIdentifier = decodeURIComponent(
        this.$('#url .deviceIdentifier')[0].value
      );
      const deviceKey = decodeURIComponent(this.$('#url .deviceKey')[0].value);
      const addDevicePromise = accountManager.addDevice(
        deviceIdentifier,
        deviceKey
      );
      addDevicePromise.then(
        () => {
          window.log.info(
            `Succesfully added device with deviceKey:${deviceKey}`
          );
          textsecure.storage.protocol.hydrateCaches();
          this.$('.statusMessage').addClass('success');
          this.$('.statusMessage').text(i18n('addDeviceSuccess'));
          this.$('.statusMessage').show();
        },
        e => {
          window.log.error(`Failed to add device with deviceKey:${deviceKey}`);
          this.$('.statusMessage').addClass('error');
          this.$('.statusMessage').text(e.message.split('.')[0]);
          this.$('.statusMessage').show();
        }
      );
    },
    onClose() {
      this.$el.trigger('openInbox');
    },
  });
})();
