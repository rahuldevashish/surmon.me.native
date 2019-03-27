
import React, { Component, ReactNode } from 'react'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { Modal, View, Animated, SafeAreaView, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import { observable, computed, action, reaction } from 'mobx'
import { observer } from 'mobx-react/native'
import { Text } from './text'
import colors from '@app/style/colors'
import sizes from '@app/style/sizes'
import mixins, { getHeaderButtonStyle } from '@app/style/mixins'

interface IModalProps {
  visible: boolean
  onClose(): void
  title?: string
  extra?: string | ReactNode
  top?: number
  opacity?: number
  children?: any
}

@observer export class BetterModal extends Component<IModalProps> {

  constructor(props: IModalProps) {
    super(props)
    // 监听显隐处理弹窗动画
    reaction(
      () => this.props.visible,
      visible => this.handleVisibleChange(visible),
      { fireImmediately: true }
    )
  }

  @observable modalVisible: boolean = false
  @observable.ref maskOpacity = new Animated.Value(0)

  @action updateVisible(visible: boolean) {
    this.modalVisible = visible
  }

  @computed get propOpacity(): number {
    return this.props.opacity || 0.5
  }

  updateMaskVisible(visible: boolean, callback?: () => void) {
    Animated.timing(this.maskOpacity, {
      toValue: visible ? this.propOpacity : 0,
      duration: 88
    }).start(callback)
  }

  handleVisibleChange(visible: boolean) {
    if (visible) {
      this.updateVisible(true)
    } else {
      this.updateMaskVisible(false, () => {
        this.updateVisible(false)
      })
    }
  }
  
  render() {
    const { props } = this
    const { styles } = obStyles
    const topHeaderHeight = props.top || 0

    return (
      <Modal
        animationType="slide"
        transparent={true}
        hardwareAccelerated={true}
        visible={this.modalVisible}
        onShow={() => this.updateMaskVisible(true)}
      >
        <Animated.View style={[styles.background, { opacity: this.maskOpacity }]} />
        <SafeAreaView style={styles.full}>
          <View style={[styles.full, styles.container, { marginTop: topHeaderHeight }]}>
            <View style={styles.header}>
              <TouchableWithoutFeedback onPress={props.onClose}>
                <Ionicon name="ios-close" {...getHeaderButtonStyle()} />
              </TouchableWithoutFeedback>
              <Text style={styles.title}>{props.title}</Text>
              {props.extra && (
                <View style={styles.extra}>{props.extra}</View>
              )}
            </View>
            <View style={styles.full}>{props.children}</View>
          </View>
        </SafeAreaView>
      </Modal>
    )
  }
}

const obStyles = observable({
  get styles() {
    return StyleSheet.create({
      full: {
        flex: 1
      },
      container: {
        backgroundColor: colors.cardBackground
      },
      background: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: colors.inverse
      },
      header: {
        ...mixins.rowCenter,
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        height: sizes.gap * 2,
        borderColor: colors.border,
        borderBottomWidth: sizes.borderWidth,
      },
      title: {},
      extra: {}
    })
  }
})
