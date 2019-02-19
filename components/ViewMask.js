// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Animated, I18nManager, TouchableOpacity } from 'react-native';
import styles from './style';
import moment from 'moment';

import type { CopilotContext, valueXY } from '../types';

const rtl = I18nManager.isRTL;
const start = rtl ? 'right' : 'left';
const end = rtl ? 'left' : 'right';

type Props = {
  size: valueXY,
  position: valueXY,
  layout: {
    width: number,
    height: number,
  },
  style: object | number | Array,
  easing: func,
  animationDuration: number,
  animated: boolean,
  backdropColor: string,
};

type State = {
  size: Animated.ValueXY,
  position: Animated.ValueXY,
  canvasSize: valueXY,
};

class ViewMask extends Component<Props, State> {
  static contextTypes = {
    _copilot: PropTypes.object,
  };

  state = {
    size: new Animated.ValueXY({ x: 0, y: 0 }),
    position: new Animated.ValueXY({ x: 0, y: 0 }),
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.position !== nextProps.position || this.props.size !== nextProps.size) {
      this.animate(nextProps.size, nextProps.position);
    }
  }

  context: {
    _copilot: CopilotContext,
  };

  animate = (size: valueXY = this.props.size, position: valueXY = this.props.position): void => {
    if (this.state.animated) {
      Animated.parallel([
        Animated.timing(this.state.size, {
          toValue: size,
          duration: this.props.animationDuration,
          easing: this.props.easing,
        }),
        Animated.timing(this.state.position, {
          toValue: position,
          duration: this.props.animationDuration,
          easing: this.props.easing,
        }),
      ]).start();
    } else {
      this.state.size.setValue(size);
      this.state.position.setValue(position);
      this.setState({ animated: this.props.animated });
    }
  };

  render() {
    //console.log({ mask: this.props.mask });
    const { size, position } = this.state;
    const width = this.props.layout ? this.props.layout.width : 500;
    const height = this.props.layout ? this.props.layout.height : 500;

    const leftOverlayRight = Animated.add(width, Animated.multiply(position.x, -1));
    const rightOverlayLeft = Animated.add(size.x, position.x);
    const bottomOverlayTopBoundary = Animated.add(size.y, position.y);
    const topOverlayBottomBoundary = Animated.add(height, Animated.multiply(-1, position.y));
    const verticalOverlayLeftBoundary = position.x;
    const verticalOverlayRightBoundary = Animated.add(width, Animated.multiply(-1, rightOverlayLeft));
    const firstProps =
      this.context._copilot && this.context._copilot.getCurrentStep() && this.context._copilot.getCurrentStep().target.props.children.props;
    if (!firstProps) return null;
    const secondProps =
      firstProps &&
      firstProps.children &&
      firstProps.children.props &&
      firstProps.children.props.children &&
      firstProps.children.props.children.props;

    const mask =
      this.props.mask == true ? (
        <View style={this.props.style}>
          <Animated.View
            style={[
              styles.overlayRectangle,
              {
                right: leftOverlayRight,
                backgroundColor: this.props.backdropColor,
                [end]: leftOverlayRight,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.overlayRectangle,
              {
                left: rightOverlayLeft,
                backgroundColor: this.props.backdropColor,
                [start]: rightOverlayLeft,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.overlayRectangle,
              {
                top: bottomOverlayTopBoundary,
                left: verticalOverlayLeftBoundary,
                right: verticalOverlayRightBoundary,
                backgroundColor: this.props.backdropColor,
                [start]: verticalOverlayLeftBoundary,
                [end]: verticalOverlayRightBoundary,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.overlayRectangle,
              {
                bottom: topOverlayBottomBoundary,
                left: verticalOverlayLeftBoundary,
                right: verticalOverlayRightBoundary,
                backgroundColor: this.props.backdropColor,
                [start]: verticalOverlayLeftBoundary,
                [end]: verticalOverlayRightBoundary,
              },
            ]}
          />
        </View>
      ) : null;
    return (
      <View style={this.props.style}>
        {mask}
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            [start]: this.props.position.x,
            [end]: this.props.layout.width - (this.props.size.x + this.props.position.x),
            top: this.props.position.y,
            width: this.props.size.x,
            height: this.props.size.y,
          }}
          onPress={() => {
            //console.log({ firstProps });
            return (
              (firstProps && firstProps.onPress && firstProps.onPress()) ||
              (firstProps && firstProps.children && firstProps.children.props.onPress && firstProps.children.props.onPress()) ||
              (firstProps && firstProps.children && firstProps.children.props.onPress)
            );
          }}
        />
      </View>
    );
  }
}

export default ViewMask;
