/**
 * App article filter component
 * @file 文章过滤器组件
 * @module app/components/archive/filter
 * @author Surmon <https://github.com/surmon-china>
 */

import React, { Component } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { observable, action, computed } from 'mobx'
import { observer } from 'mobx-react'
import { optionStore } from '@app/stores/option'
import { Iconfont } from '@app/components/common/iconfont'
import { Text } from '@app/components/common/text'
import { BetterModal } from '@app/components/common/modal'
import { TouchableView } from '@app/components/common/touchable-view'
import { LANGUAGE_KEYS } from '@app/constants/language'
import { ICategory, ITag } from '@app/types/business'
import { IHttpResultPaginate, THttpSuccessResponse } from '@app/types/http'
import { ValueOf } from '@app/utils/transformer'
import i18n from '@app/services/i18n'
import fetch from '@app/services/fetch'
import mixins, { getHeaderButtonStyle } from '@app/style/mixins'
import sizes, { defaultHeaderHeight } from '@app/style/sizes'
import fonts from '@app/style/fonts'
import colors from '@app/style/colors'

export enum EFilterType {
  Tag = 'Tag',
  Category = 'Category',
  Search = 'Search'
}

export interface IFilterValues {
  [EFilterType.Tag]: ITag | null
  [EFilterType.Category]: ICategory | null
  [EFilterType.Search]: string | null
}

export type TFilterValue = ITag | ICategory | string

class Store {

  constructor() {
    this.fetchTags()
    this.fetchCategories()
  }

  @observable filterActive: boolean = false // 是否激活
  @observable filterType: EFilterType = EFilterType.Category // 激活的类型
  @observable filterValues: IFilterValues = {
    [EFilterType.Tag]: null,
    [EFilterType.Category]: null,
    [EFilterType.Search]: null
  }

  @observable.ref tags: ITag[] = []
  @observable.ref categories: ICategory[] = []
  @observable modalVisible: boolean = false

  // 是否拥有文章或分类过滤条件
  @computed
  get isActiveTagOrCategoryFilter(): boolean {
    return (
      this.filterActive &&
      [EFilterType.Tag, EFilterType.Category].includes(this.filterType as unknown as number)
    )
  }

  // 过滤条件类型文案
  @computed
  get filterTypeText(): string {
    const typeTextMap: Record<ValueOf<typeof EFilterType>, string> = {
      [EFilterType.Tag]: i18n.t(LANGUAGE_KEYS.TAG),
      [EFilterType.Category]: i18n.t(LANGUAGE_KEYS.CATEGORY),
      [EFilterType.Search]: i18n.t(LANGUAGE_KEYS.SEARCH)
    }
    return typeTextMap[this.filterType]
  }

  // 当前过滤条件的值
  @computed
  get filterValue(): TFilterValue | void {
    if (this.filterType === EFilterType.Search) {
      return this.filterValues[EFilterType.Search] as string
    }
    if (this.filterType === EFilterType.Tag) {
      return this.filterValues[EFilterType.Tag] as ITag
    }
    if (this.filterType === EFilterType.Category) {
      return this.filterValues[EFilterType.Category] as ICategory
    }
  }
  
  @action.bound
  updateActiveFilter(type: EFilterType, value: TFilterValue) {
    this.filterType = type
    this.filterValues[type] = value as any
    this.filterActive = true
  }

  @action.bound
  clearActiveFilter() {
    this.filterActive = false
  }

  @action.bound
  updateVisibleState(visible: boolean) {
    this.modalVisible = visible
  }
  
  private fetchTags() {
    return fetch.get<IHttpResultPaginate<ITag[]>>('/tag', { per_page: 666 })
      .then(action((result: THttpSuccessResponse<IHttpResultPaginate<ITag[]>>) => {
        this.tags = result.result.data
      }))
  }

  private fetchCategories() {
    return fetch.get<IHttpResultPaginate<ICategory[]>>('/category')
      .then(action((result: THttpSuccessResponse<IHttpResultPaginate<ICategory[]>>) => {
        this.categories = result.result.data
      }))
  }
}

export const archiveFilterStore = new Store()
export interface IArchiveFilterProps {}

@observer
export class ArchiveFilter extends Component<IArchiveFilterProps> {

  getIconNameFromExtend(target: any) {
    if (!target || !target.extends.length) {
      return null
    }
    const targetExtend = target.extends.find((t: any) => t.name === 'icon')
    return targetExtend?.value?.replace('icon-', '') || null
  }

  @computed
  private get scrollFilterListView(): JSX.Element {

    const { styles } = obStyles
    const filters = [
      {
        name: i18n.t(LANGUAGE_KEYS.CATEGORIES),
        type: EFilterType.Category,
        data: archiveFilterStore.categories,
        defaultIconName: 'category'
      },
      {
        name: i18n.t(LANGUAGE_KEYS.TAGS),
        type: EFilterType.Tag,
        data: archiveFilterStore.tags,
        defaultIconName: 'tag'
      }
    ]

    return (
      <ScrollView style={styles.container}>
        {filters.map(filter => (
          <View key={filter.type}>
            <Text style={fonts.h4}>{filter.name}</Text>
            <View style={styles.list}>
              {filter.data.map(item => {
                const { filterActive: isFilterActive, filterType, filterValues } = archiveFilterStore
                const activeValue = filterValues[filterType] as ICategory
                const activeValueText = optionStore.isEnLang ? item.slug : item.name
                const isActive = (
                  isFilterActive &&
                  filterType === filter.type && 
                  activeValue &&
                  activeValue.slug === item.slug
                )
                return (
                  <TouchableView
                    key={item._id}
                    style={[
                      styles.item,
                      isActive && styles.itemActive
                    ]}
                    disabled={isActive}
                    accessibilityLabel={`选中过滤条件：${activeValueText}`}
                    onPress={() => {
                      archiveFilterStore.updateActiveFilter(filter.type, item)
                      archiveFilterStore.updateVisibleState(false)
                    }}
                  >
                    <View style={[styles.itemIconView, isActive && styles.itemIconViewActive]}>
                      <Iconfont
                        name={this.getIconNameFromExtend(item) || filter.defaultIconName}
                        style={isActive && styles.itemIconActive}
                      />
                    </View>
                    <Text
                      style={[
                        styles.itemText,
                        isActive && styles.itemTextActive
                      ]}
                    >
                      {activeValueText}
                    </Text>
                    {isActive && (
                      <Iconfont
                        name="success"
                        style={[
                          styles.itemSelectedIcon,
                          isActive && styles.itemTextActive
                        ]}
                      />
                    )}
                  </TouchableView>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    )
  }

  render() {
    return (
      <BetterModal
        top={defaultHeaderHeight}
        title={i18n.t(LANGUAGE_KEYS.FILTER_BY_TAG_CATEGORY)}
        visible={archiveFilterStore.modalVisible}
        onClose={() => archiveFilterStore.updateVisibleState(false)}
        extra={(
          <TouchableView
            accessibilityLabel="清空所有文章过滤条件"
            onPress={() => {
              archiveFilterStore.clearActiveFilter()
              archiveFilterStore.updateVisibleState(false)
            }}
          >
            <Iconfont
              name="reply"
              color={colors.textLink}
              {...getHeaderButtonStyle()}
            />
          </TouchableView>
        )}
      >
        {this.scrollFilterListView}
      </BetterModal>
    )
  }
}

const obStyles = observable({
  get styles() {
    const itemSize = 30
    return StyleSheet.create({
      modal: {
        justifyContent: 'flex-end',
        margin: 0
      },
      container: {
        flex: 1,
        padding: sizes.gap
      },
      header: {
        height: 30,
        borderColor: colors.border,
        borderBottomWidth: sizes.borderWidth
      },
      list: {
        ...mixins.rowCenter,
        flexWrap: 'wrap',
        marginVertical: sizes.gap,
        marginBottom: sizes.gap + sizes.goldenRatioGap
      },
      item: {
        ...mixins.rowCenter,
        height: itemSize,
        paddingRight: sizes.goldenRatioGap,
        backgroundColor: colors.background,
        marginRight: sizes.goldenRatioGap,
        marginBottom: sizes.gap
      },
      itemText: {
        fontSize: fonts.small.fontSize,
        textTransform: 'capitalize'
      },
      itemIconView: {
        width: itemSize,
        height: itemSize,
        ...mixins.center,
        marginRight: 8,
        backgroundColor: colors.grey
      },
      itemIconViewActive: {
        backgroundColor: colors.background
      },
      itemIconActive: {
        color: colors.primary
      },
      itemActive: {
        backgroundColor: colors.primary
      },
      itemTextActive: {
        color: colors.background
      },
      itemSelectedIcon: {
        marginLeft: 8
      }
    })
  }
})
