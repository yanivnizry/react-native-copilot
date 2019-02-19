// @flow
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Button from './Button';
import styles from './style';
import type { Step } from '../types';
import I18n from '../../i18n/i18n';
type Props = {
  isFirstStep: boolean,
  isLastStep: boolean,
  isNext: boolean,
  handleNext: func,
  handlePrev: func,
  handleStop: func,
  currentStep: Step,
};

const Tooltip = ({ isFirstStep, isLastStep, isNext, handleNext, handlePrev, handleStop, currentStep }: Props) => (
  <View>
    <View style={styles.tooltipContainer}>
      <Text testID="stepDescription" style={styles.tooltipText}>
        {currentStep && currentStep.text}
      </Text>
    </View>
    <View style={[styles.bottomBar]}>
      {
        <TouchableOpacity onPress={handleStop}>
          <Button>{I18n.t('skip')}</Button>
        </TouchableOpacity>
      }
      {/*
        !isFirstStep ?
          <TouchableOpacity onPress={handlePrev}>
            <Button>{I18n.t('previous')}</Button>
          </TouchableOpacity>
          : null
      */}
      {isNext ? (
        <TouchableOpacity onPress={handleNext}>
          <Button>{I18n.t('next')}</Button>
        </TouchableOpacity>
      ) : (
        <Text> </Text>
      )}
      {/*
        !isLastStep ?
          <TouchableOpacity onPress={handleNext}>
            <Button>{I18n.t('next')}</Button>
          </TouchableOpacity> :
          <TouchableOpacity onPress={handleStop}>
            <Button>{I18n.t('finish')}</Button>
          </TouchableOpacity>
      */}
    </View>
  </View>
);

export default Tooltip;
