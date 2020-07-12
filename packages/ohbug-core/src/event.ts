import type {
  OhbugEventWithMethods,
  OhbugEvent,
  OhbugCreateEvent,
  OhbugClient,
  OhbugUser,
  OhbugAction,
  OhbugCategory,
  OhbugDevice,
  OhbugReleaseStage,
} from '@ohbug/types'

import { createDevice } from './device'
import { isObject, isString } from '@ohbug/utils'
import { Action } from './action'
import { getErrorMessage } from './lib/getErrorMessage'
import { addMetaData, getMetaData, deleteMetaData } from './lib/metaData'

export class Event<D> implements OhbugEventWithMethods<D> {
  readonly apiKey: string
  readonly appVersion?: string
  readonly appType?: string
  readonly timestamp: string
  readonly category?: OhbugCategory
  readonly type: string
  readonly device: OhbugDevice
  readonly detail: D
  user?: OhbugUser
  readonly actions?: OhbugAction[]
  readonly metaData?: any
  readonly releaseStage?: OhbugReleaseStage

  readonly _client?: OhbugClient

  constructor(values: OhbugEvent<D>, client?: OhbugClient) {
    const {
      apiKey,
      appVersion,
      appType,
      timestamp,
      category,
      type,
      device,
      detail,
      user,
      actions,
      metaData,
      releaseStage,
    } = values
    this.apiKey = apiKey
    this.appVersion = appVersion
    this.appType = appType
    this.timestamp = timestamp
    this.category = category
    this.type = type
    this.device = device
    this.detail = detail
    this.user = user
    this.actions = actions
    this.metaData = metaData
    this.releaseStage = releaseStage

    this._client = client
  }

  get _isOhbugEvent() {
    return true
  }

  /**
   * Add an action.
   * Once the threshold is reached, the oldest breadcrumbs will be deleted.
   * 新增一个动作。
   * 一旦达到阈值，最老的 Action 将被删除。
   *
   * @param message
   * @param data
   * @param type
   * @param timestamp
   */
  addAction(message: string, data: Record<string, any>, type: string, timestamp?: string): void {
    const actions = this.actions!

    message = isString(message) ? message : ''
    data = isObject(data) ? data : {}
    type = isString(type) ? type : ''

    const action = new Action(message, data, type, timestamp)
    if (actions.length >= this._client?._config.maxActions!) {
      actions.shift()
    }
    actions.push(action)
  }

  /**
   * Get current user information
   * 获取当前的用户信息
   */
  getUser(): OhbugUser | undefined {
    return this.user
  }

  /**
   * Set current user information
   * 设置当前的用户信息
   */
  setUser(user: OhbugUser): OhbugUser | undefined {
    if (isObject(user) && Object.keys(user).length <= 6) {
      this.user = Object.assign({}, this.user, user)
      return this.getUser()
    }
    this._client?._logger.warn(
      getErrorMessage('setUser should be an object and have up to 6 attributes', user)
    )
  }

  /**
   * Add metaData
   * 新增 metaData
   *
   * @param section
   * @param data
   */
  addMetaData(section: string, data: any) {
    return addMetaData(this.metaData, section, data)
  }

  /**
   * Get metaData
   * 获取 metaData
   *
   * @param section
   */
  getMetaData(section: string) {
    return getMetaData(this.metaData, section)
  }

  /**
   * Delete metaData
   * 删除 metaData
   *
   * @param section
   */
  deleteMetaData(section: string) {
    return deleteMetaData(this.metaData, section)
  }

  toJSON() {
    const {
      apiKey,
      appVersion,
      appType,
      timestamp,
      category,
      type,
      device,
      detail,
      user,
      actions,
      metaData,
      releaseStage,
    } = this
    return {
      apiKey,
      appVersion,
      appType,
      timestamp,
      category,
      type,
      device,
      detail,
      user,
      actions,
      metaData: Object.fromEntries(metaData),
      releaseStage,
    }
  }
}

export function createEvent<D>(
  values: OhbugCreateEvent<D>,
  client: OhbugClient
): OhbugEventWithMethods<D> {
  const { apiKey, appVersion, appType, releaseStage } = client._config
  const timestamp = new Date().toISOString()
  const device = createDevice(client)
  let category: OhbugCategory, type: string, detail: D
  if (
    isObject(values) &&
    Object.prototype.hasOwnProperty.call(values, 'type') &&
    Object.prototype.hasOwnProperty.call(values, 'detail')
  ) {
    category = values.category || 'error'
    type = values.type
    detail = values.detail
  } else {
    category = 'error'
    type = 'unknownError'
    detail = (values as unknown) as D
  }

  return new Event(
    {
      apiKey,
      appVersion,
      appType,
      timestamp,
      category,
      type,
      device,
      user: client._user,
      detail,
      actions: client._actions,
      metaData: client._metaData,
      releaseStage,
    },
    client
  )
}

export function isEvent(eventLike: any): eventLike is OhbugEventWithMethods<any> {
  return Boolean(eventLike?._isOhbugEvent)
}
