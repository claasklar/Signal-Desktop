// Copyright 2018-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { ReactNode } from 'react';
import Measure from 'react-measure';
import moment from 'moment';
import classNames from 'classnames';
import {
  ContextMenu,
  ContextMenuTrigger,
  MenuItem,
  SubMenu,
} from 'react-contextmenu';

import { Emojify } from './Emojify';
import { Avatar, AvatarSize } from '../Avatar';
import { InContactsIcon } from '../InContactsIcon';

import { LocalizerType } from '../../types/Util';
import { ConversationType } from '../../state/ducks/conversations';
import { MuteOption, getMuteOptions } from '../../util/getMuteOptions';
import * as expirationTimer from '../../util/expirationTimer';
import { isMuted } from '../../util/isMuted';
import { missingCaseError } from '../../util/missingCaseError';
import { NameInput } from './NameInput';

export enum OutgoingCallButtonStyle {
  None,
  JustVideo,
  Both,
  Join,
}

export type PropsDataType = {
  conversationTitle?: string;
  isMissingMandatoryProfileSharing?: boolean;
  outgoingCallButtonStyle: OutgoingCallButtonStyle;
  showBackButton?: boolean;
  isSMSOnly?: boolean;
} & Pick<
  ConversationType,
  | 'acceptedMessageRequest'
  | 'avatarPath'
  | 'canChangeTimer'
  | 'color'
  | 'expireTimer'
  | 'groupVersion'
  | 'id'
  | 'isArchived'
  | 'isMe'
  | 'isPinned'
  | 'isVerified'
  | 'left'
  | 'markedUnread'
  | 'muteExpiresAt'
  | 'name'
  | 'phoneNumber'
  | 'profileName'
  | 'sharedGroupNames'
  | 'title'
  | 'type'
  | 'unblurredAvatarPath'
>;

export type PropsActionsType = {
  onSetMuteNotifications: (seconds: number) => void;
  onSetDisappearingMessages: (seconds: number) => void;
  onShowContactModal: (contactId: string) => void;
  onDeleteMessages: () => void;
  onResetSession: () => void;
  onSearchInConversation: () => void;
  onOutgoingAudioCallInConversation: () => void;
  onOutgoingVideoCallInConversation: () => void;
  onSetPin: (value: boolean) => void;

  onShowConversationDetails: () => void;
  onShowSafetyNumber: () => void;
  onShowAllMedia: () => void;
  onShowGroupMembers: () => void;
  onGoBack: () => void;

  onArchive: () => void;
  onMarkUnread: () => void;
  onMoveToInbox: () => void;
  onNameChange: (name: string) => void;
};

export type PropsHousekeepingType = {
  i18n: LocalizerType;
};

export type PropsType = PropsDataType &
  PropsActionsType &
  PropsHousekeepingType;

type StateType = {
  isNarrow: boolean;
  isInTitleEdit: boolean;
};

export class ConversationHeader extends React.Component<PropsType, StateType> {
  private showMenuBound: (event: React.MouseEvent<HTMLButtonElement>) => void;

  // Comes from a third-party dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private menuTriggerRef: React.RefObject<any>;

  public constructor(props: PropsType) {
    super(props);

    this.state = { isNarrow: false, isInTitleEdit: false };

    this.menuTriggerRef = React.createRef();
    this.showMenuBound = this.showMenu.bind(this);
  }

  private showMenu(event: React.MouseEvent<HTMLButtonElement>): void {
    if (this.menuTriggerRef.current) {
      this.menuTriggerRef.current.handleContextClick(event);
    }
  }

  private renderBackButton(): ReactNode {
    const { i18n, onGoBack, showBackButton } = this.props;

    return (
      <button
        type="button"
        onClick={onGoBack}
        className={classNames(
          'module-ConversationHeader__back-icon',
          showBackButton ? 'module-ConversationHeader__back-icon--show' : null
        )}
        disabled={!showBackButton}
        aria-label={i18n('goBack')}
      />
    );
  }

  private renderHeaderInfoTitle(): ReactNode {
    const { name, title, type, i18n, isMe, onNameChange } = this.props;

    const { isInTitleEdit } = this.state;

    if (isMe) {
      return (
        <div className="module-ConversationHeader__header__info__title">
          {i18n('noteToSelf')}
        </div>
      );
    }

    const shouldShowIcon = Boolean(name && type === 'direct');

    if (isInTitleEdit) {
      return (
        <NameInput
          name={name || ''}
          i18n={i18n}
          onNameChange={(changedName: string) => {
            onNameChange(changedName);
            this.setState({ isInTitleEdit: false });
          }}
        />
      );
    }

    return (
      <div className="module-ConversationHeader__header__info__title">
        <Emojify text={title} />
        {shouldShowIcon ? (
          <InContactsIcon
            className="module-ConversationHeader__header__info__title__in-contacts-icon"
            i18n={i18n}
          />
        ) : null}
      </div>
    );
  }

  private renderHeaderInfoSubtitle(): ReactNode {
    const expirationNode = this.renderExpirationLength();
    const verifiedNode = this.renderVerifiedIcon();

    if (expirationNode || verifiedNode) {
      return (
        <div className="module-ConversationHeader__header__info__subtitle">
          {expirationNode}
          {verifiedNode}
        </div>
      );
    }

    return null;
  }

  private renderAvatar(): ReactNode {
    const {
      acceptedMessageRequest,
      avatarPath,
      color,
      i18n,
      type,
      isMe,
      name,
      phoneNumber,
      profileName,
      sharedGroupNames,
      title,
      unblurredAvatarPath,
    } = this.props;

    return (
      <span className="module-ConversationHeader__header__avatar">
        <Avatar
          acceptedMessageRequest={acceptedMessageRequest}
          avatarPath={avatarPath}
          color={color}
          conversationType={type}
          i18n={i18n}
          isMe={isMe}
          noteToSelf={isMe}
          title={title}
          name={name}
          phoneNumber={phoneNumber}
          profileName={profileName}
          sharedGroupNames={sharedGroupNames}
          size={AvatarSize.THIRTY_TWO}
          unblurredAvatarPath={unblurredAvatarPath}
        />
      </span>
    );
  }

  private renderExpirationLength(): ReactNode {
    const { i18n, expireTimer } = this.props;

    if (!expireTimer) {
      return null;
    }

    return (
      <div className="module-ConversationHeader__header__info__subtitle__expiration">
        {expirationTimer.format(i18n, expireTimer)}
      </div>
    );
  }

  private renderVerifiedIcon(): ReactNode {
    const { i18n, isVerified } = this.props;

    if (!isVerified) {
      return null;
    }

    return (
      <div className="module-ConversationHeader__header__info__subtitle__verified">
        {i18n('verified')}
      </div>
    );
  }

  private renderMoreButton(triggerId: string): ReactNode {
    const { i18n, showBackButton } = this.props;

    return (
      <ContextMenuTrigger id={triggerId} ref={this.menuTriggerRef}>
        <button
          type="button"
          onClick={this.showMenuBound}
          className={classNames(
            'module-ConversationHeader__button',
            'module-ConversationHeader__button--more',
            showBackButton ? null : 'module-ConversationHeader__button--show'
          )}
          disabled={showBackButton}
          aria-label={i18n('moreInfo')}
        />
      </ContextMenuTrigger>
    );
  }

  private renderSearchButton(): ReactNode {
    const { i18n, onSearchInConversation, showBackButton } = this.props;

    return (
      <button
        type="button"
        onClick={onSearchInConversation}
        className={classNames(
          'module-ConversationHeader__button',
          'module-ConversationHeader__button--search',
          showBackButton ? null : 'module-ConversationHeader__button--show'
        )}
        disabled={showBackButton}
        aria-label={i18n('search')}
      />
    );
  }

  private renderOutgoingCallButtons(): ReactNode {
    const {
      i18n,
      onOutgoingAudioCallInConversation,
      onOutgoingVideoCallInConversation,
      outgoingCallButtonStyle,
      showBackButton,
    } = this.props;
    const { isNarrow } = this.state;

    const videoButton = (
      <button
        type="button"
        onClick={onOutgoingVideoCallInConversation}
        className={classNames(
          'module-ConversationHeader__button',
          'module-ConversationHeader__button--video',
          showBackButton ? null : 'module-ConversationHeader__button--show'
        )}
        disabled={showBackButton}
        aria-label={i18n('makeOutgoingVideoCall')}
      />
    );

    switch (outgoingCallButtonStyle) {
      case OutgoingCallButtonStyle.None:
        return null;
      case OutgoingCallButtonStyle.JustVideo:
        return videoButton;
      case OutgoingCallButtonStyle.Both:
        return (
          <>
            {videoButton}
            <button
              type="button"
              onClick={onOutgoingAudioCallInConversation}
              className={classNames(
                'module-ConversationHeader__button',
                'module-ConversationHeader__button--audio',
                showBackButton
                  ? null
                  : 'module-ConversationHeader__button--show'
              )}
              disabled={showBackButton}
              aria-label={i18n('makeOutgoingCall')}
            />
          </>
        );
      case OutgoingCallButtonStyle.Join:
        return (
          <button
            aria-label={i18n('joinOngoingCall')}
            type="button"
            onClick={onOutgoingVideoCallInConversation}
            className={classNames(
              'module-ConversationHeader__button',
              'module-ConversationHeader__button--join-call',
              showBackButton ? null : 'module-ConversationHeader__button--show'
            )}
            disabled={showBackButton}
          >
            {isNarrow ? null : i18n('joinOngoingCall')}
          </button>
        );
      default:
        throw missingCaseError(outgoingCallButtonStyle);
    }
  }

  private renderMenu(triggerId: string): ReactNode {
    const {
      i18n,
      acceptedMessageRequest,
      canChangeTimer,
      isArchived,
      isMe,
      isPinned,
      type,
      markedUnread,
      muteExpiresAt,
      isMissingMandatoryProfileSharing,
      left,
      groupVersion,
      onDeleteMessages,
      onResetSession,
      onSetDisappearingMessages,
      onSetMuteNotifications,
      onShowAllMedia,
      onShowConversationDetails,
      onShowGroupMembers,
      onShowSafetyNumber,
      onArchive,
      onMarkUnread,
      onSetPin,
      onMoveToInbox,
    } = this.props;

    const muteOptions: Array<MuteOption> = [];
    if (isMuted(muteExpiresAt)) {
      const expires = moment(muteExpiresAt);

      let muteExpirationLabel: string;
      if (Number(muteExpiresAt) >= Number.MAX_SAFE_INTEGER) {
        muteExpirationLabel = i18n('muteExpirationLabelAlways');
      } else {
        const muteExpirationUntil = moment().isSame(expires, 'day')
          ? expires.format('hh:mm A')
          : expires.format('M/D/YY, hh:mm A');

        muteExpirationLabel = i18n('muteExpirationLabel', [
          muteExpirationUntil,
        ]);
      }

      muteOptions.push(
        ...[
          {
            name: muteExpirationLabel,
            disabled: true,
            value: 0,
          },
          {
            name: i18n('unmute'),
            value: 0,
          },
        ]
      );
    }
    muteOptions.push(...getMuteOptions(i18n));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const disappearingTitle = i18n('disappearingMessages') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const muteTitle = i18n('muteNotificationsTitle') as any;
    const isGroup = type === 'group';

    const disableTimerChanges = Boolean(
      !canChangeTimer ||
        !acceptedMessageRequest ||
        left ||
        isMissingMandatoryProfileSharing
    );

    const hasGV2AdminEnabled = isGroup && groupVersion === 2;

    return (
      <ContextMenu id={triggerId}>
        {disableTimerChanges ? null : (
          <SubMenu title={disappearingTitle}>
            {expirationTimer.DEFAULT_DURATIONS_IN_SECONDS.map(
              (seconds: number) => (
                <MenuItem
                  key={seconds}
                  onClick={() => {
                    onSetDisappearingMessages(seconds);
                  }}
                >
                  {expirationTimer.format(i18n, seconds)}
                </MenuItem>
              )
            )}
          </SubMenu>
        )}
        <SubMenu title={muteTitle}>
          {muteOptions.map(item => (
            <MenuItem
              key={item.name}
              disabled={item.disabled}
              onClick={() => {
                onSetMuteNotifications(item.value);
              }}
            >
              {item.name}
            </MenuItem>
          ))}
        </SubMenu>
        {hasGV2AdminEnabled ? (
          <MenuItem onClick={onShowConversationDetails}>
            {i18n('showConversationDetails')}
          </MenuItem>
        ) : null}
        {isGroup && !hasGV2AdminEnabled ? (
          <MenuItem onClick={onShowGroupMembers}>
            {i18n('showMembers')}
          </MenuItem>
        ) : null}
        <MenuItem onClick={onShowAllMedia}>{i18n('viewRecentMedia')}</MenuItem>
        {!isGroup && !isMe ? (
          <MenuItem onClick={onShowSafetyNumber}>
            {i18n('showSafetyNumber')}
          </MenuItem>
        ) : null}
        {!isGroup && acceptedMessageRequest ? (
          <MenuItem onClick={onResetSession}>{i18n('resetSession')}</MenuItem>
        ) : null}
        <MenuItem divider />
        {!markedUnread ? (
          <MenuItem onClick={onMarkUnread}>{i18n('markUnread')}</MenuItem>
        ) : null}
        {isArchived ? (
          <MenuItem onClick={onMoveToInbox}>
            {i18n('moveConversationToInbox')}
          </MenuItem>
        ) : (
          <MenuItem onClick={onArchive}>{i18n('archiveConversation')}</MenuItem>
        )}
        <MenuItem onClick={onDeleteMessages}>{i18n('deleteMessages')}</MenuItem>
        {isPinned ? (
          <MenuItem onClick={() => onSetPin(false)}>
            {i18n('unpinConversation')}
          </MenuItem>
        ) : (
          <MenuItem onClick={() => onSetPin(true)}>
            {i18n('pinConversation')}
          </MenuItem>
        )}
        <MenuItem onClick={() => this.setState({ isInTitleEdit: true })}>
          {i18n('editName')}
        </MenuItem>
      </ContextMenu>
    );
  }

  private renderHeader(): ReactNode {
    const {
      conversationTitle,
      groupVersion,
      id,
      isMe,
      onShowContactModal,
      onShowConversationDetails,
      type,
    } = this.props;
    const { isInTitleEdit } = this.state;

    if (conversationTitle !== undefined) {
      return (
        <div className="module-ConversationHeader__header">
          <div className="module-ConversationHeader__header__info">
            <div className="module-ConversationHeader__header__info__title">
              {conversationTitle}
            </div>
          </div>
        </div>
      );
    }

    let onClick: undefined | (() => void);
    switch (type) {
      case 'direct':
        onClick =
          isMe || isInTitleEdit
            ? undefined
            : () => {
                onShowContactModal(id);
              };
        break;
      case 'group': {
        const hasGV2AdminEnabled = groupVersion === 2;
        onClick = hasGV2AdminEnabled
          ? () => {
              onShowConversationDetails();
            }
          : undefined;
        break;
      }
      default:
        throw missingCaseError(type);
    }

    const contents = (
      <>
        {this.renderAvatar()}
        <div className="module-ConversationHeader__header__info">
          {this.renderHeaderInfoTitle()}
          {this.renderHeaderInfoSubtitle()}
        </div>
      </>
    );

    if (onClick) {
      return (
        <button
          type="button"
          className="module-ConversationHeader__header module-ConversationHeader__header--clickable"
          onClick={onClick}
        >
          {contents}
        </button>
      );
    }

    return <div className="module-ConversationHeader__header">{contents}</div>;
  }

  public render(): ReactNode {
    const { id, isSMSOnly } = this.props;
    const { isNarrow } = this.state;
    const triggerId = `conversation-${id}`;

    return (
      <Measure
        bounds
        onResize={({ bounds }) => {
          if (!bounds || !bounds.width) {
            return;
          }
          this.setState({ isNarrow: bounds.width < 500 });
        }}
      >
        {({ measureRef }) => (
          <div
            className={classNames('module-ConversationHeader', {
              'module-ConversationHeader--narrow': isNarrow,
            })}
            ref={measureRef}
          >
            {this.renderBackButton()}
            {this.renderHeader()}
            {!isSMSOnly && this.renderOutgoingCallButtons()}
            {this.renderSearchButton()}
            {this.renderMoreButton(triggerId)}
            {this.renderMenu(triggerId)}
          </div>
        )}
      </Measure>
    );
  }
}
