// Copyright 2019-2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { createSelector } from 'reselect';

import { LocalizerType, ThemeType } from '../../types/Util';

import { StateType } from '../reducer';
import { UserStateType } from '../ducks/user';

export const getUser = (state: StateType): UserStateType => state.user;

export const getUserNumber = createSelector(
  getUser,
  (state: UserStateType): string => state.ourNumber
);

export const getRegionCode = createSelector(
  getUser,
  (state: UserStateType): string => state.regionCode
);

export const getUserConversationId = createSelector(
  getUser,
  (state: UserStateType): string => state.ourConversationId
);

export const getUserUuid = createSelector(
  getUser,
  (state: UserStateType): string => state.ourUuid
);

export const getIntl = createSelector(
  getUser,
  (state: UserStateType): LocalizerType => state.i18n
);

export const getInteractionMode = createSelector(
  getUser,
  (state: UserStateType) => state.interactionMode
);

export const getAttachmentsPath = createSelector(
  getUser,
  (state: UserStateType): string => state.attachmentsPath
);

export const getStickersPath = createSelector(
  getUser,
  (state: UserStateType): string => state.stickersPath
);

export const getPlatform = createSelector(
  getUser,
  (state: UserStateType): string => state.platform
);

export const getTempPath = createSelector(
  getUser,
  (state: UserStateType): string => state.tempPath
);

export const getTheme = createSelector(
  getUser,
  (state: UserStateType): ThemeType => state.theme
);
