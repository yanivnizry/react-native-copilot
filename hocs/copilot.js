// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { View } from 'react-native';

import mitt from 'mitt';
import hoistStatics from 'hoist-non-react-statics';

import CopilotModal from '../components/CopilotModal';
import { OFFSET_WIDTH } from '../components/style';

import { getFirstStep, getLastStep, getStepNumber, getPrevStep, getNextStep } from '../utilities';

import { setWizardState, getWizardState } from '../../globals/utils';
import { Step, CopilotContext } from '../types';
import { advanceCopilot, reverseCopilot, isNext } from '../../globals/utils';
import { setCurrentWizardStep } from '../../globals/Constants';
/*
This is the maximum wait time for the steps to be registered before starting the tutorial
At 60fps means 2 seconds
*/
const MAX_START_TRIES = 120;

type State = {
  steps: { [string]: Step },
  currentStep: ?Step,
  visible: boolean,
  androidStatusBarVisible: boolean,
  backdropColor: string,
};

const copilot = ({
  overlay,
  mask,
  tooltipComponent,
  stepNumberComponent,
  animated,
  androidStatusBarVisible,
  backdropColor,
  verticalOffset = 0,
} = {}) => WrappedComponent => {
  class Copilot extends Component<any, State> {
    state = {
      steps: {},
      currentStep: 100,
      visible: true,
    };

    getChildContext(): { _copilot: CopilotContext } {
      return {
        _copilot: {
          registerStep: this.registerStep,
          unregisterStep: this.unregisterStep,
          getCurrentStep: () => this.state.currentStep,
        },
      };
    }

    componentDidMount() {
      this.mounted = true;
    }

    componentWillUnmount() {
      this.mounted = false;
    }

    getStepNumber = (step: ?Step = this.state.currentStep): number => getStepNumber(this.state.steps, step);

    getFirstStep = (): ?Step => getFirstStep(this.state.steps);

    getLastStep = (): ?Step => getLastStep(this.state.steps);

    getPrevStep = (step: ?Step = this.state.currentStep): ?Step => getPrevStep(this.state.steps, step);

    getNextStep = (step: ?Step = this.state.currentStep): ?Step => getNextStep(this.state.steps, step);

    getStepByName = (step: ?Step = this.state.currentStep, name: string): ?Step => {
      let next = this.state.currentStep;
      if (!next) return;
      while (next.name !== name) {
        const prev = next;
        next = getNextStep(this.state.steps, prev);
        if (next == prev) return null;
      }
      return next;
    };

    setCurrentStep = async (step: Step, move?: boolean = true): void => {
      await this.setState({ currentStep: step });
      this.eventEmitter.emit('stepChange', step);

      if (move) {
        this.moveToCurrentStep();
      }
    };

    setVisibility = (visible: boolean): void =>
      new Promise(resolve => {
        this.setState({ visible }, () => resolve());
      });

    startTries = 0;

    mounted = false;

    eventEmitter = mitt();

    isFirstStep = (): boolean => this.state.currentStep === this.getFirstStep();

    isLastStep = (): boolean => this.state.currentStep === this.getLastStep();

    registerStep = (step: Step): void => {
      //console.log('register:' + step.name);
      this.setState(({ steps }) => ({
        steps: {
          ...steps,
          [step.name]: step,
        },
      }));
    };

    unregisterStep = (stepName: string): void => {
      if (!this.mounted) {
        return;
      }
      this.setState(({ steps }) => ({
        steps: Object.entries(steps)
          .filter(([key]) => key !== stepName)
          .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {}),
      }));
    };

    /*next = async (): void => {
        //console.log("next");
        await advanceCopilot();
      }

      prev = async (): void => {
        //console.log("prev");
        await reverseCopilot();
      }*/
    next = async (): void => {
      //console.log('next');
      const next = await this.getNextStep();
      if (next) {
        setCurrentWizardStep(String(next.order));
        setWizardState(String(next.order));
      }
      await this.setCurrentStep(next);
    };

    prev = async (): void => {
      // //console.log("prev")
      const prev = await this.getPrevStep();
      if (prev) {
        setCurrentWizardStep(String(prev.order));
        setWizardState(String(prev.order));
      }
      await this.setCurrentStep(prev);
    };

    setStep = async ({ name }): void => {
      const step = await this.getStepByName(this.getFirstStep(), name);
      if (step) setWizardState(String(step.order));
      await this.setCurrentStep(step);
    };

    start = async (fromStep?: number): void => {
      const { steps } = this.state;

      const currentStep = fromStep ? steps[fromStep] : this.getFirstStep();

      if (this.startTries > MAX_START_TRIES) {
        this.startTries = 0;
        return;
      }

      if (!currentStep) {
        this.startTries += 1;
        requestAnimationFrame(() => this.start(fromStep));
      } else {
        this.eventEmitter.emit('start');
        await this.setCurrentStep(currentStep);
        await this.moveToCurrentStep();
        await this.setVisibility(true);
        this.startTries = 0;
      }
    };

    stop = async (): void => {
      console.log('stop');
      await this.setVisibility(false);
      this.eventEmitter.emit('stop');
    };

    async moveToCurrentStep(): void {
      const size = await this.state.currentStep.target.measure();

      await this.modal.animateMove({
        width: size.width + OFFSET_WIDTH,
        height: size.height + OFFSET_WIDTH,
        left: size.x - OFFSET_WIDTH / 2,
        top: size.y - OFFSET_WIDTH / 2 + verticalOffset,
      });
    }

    render() {
      return (
        <View style={{ flex: 1 }}>
          <WrappedComponent
            {...this.props}
            start={this.start}
            stop={this.stop}
            next={this.next}
            prev={this.prev}
            setStep={this.setStep}
            currentStep={this.state.currentStep}
            visible={this.state.visible}
            copilotEvents={this.eventEmitter}
          />
          <CopilotModal
            next={this.next}
            prev={this.prev}
            stop={this.stop}
            visible={this.state.visible}
            isFirstStep={this.isFirstStep()}
            isLastStep={this.isLastStep()}
            isNext={isNext()}
            currentStepNumber={this.state.currentStep && this.state.currentStep.order}
            currentStep={this.state.currentStep}
            stepNumberComponent={stepNumberComponent}
            tooltipComponent={tooltipComponent}
            overlay={overlay}
            mask={mask}
            animated={animated}
            androidStatusBarVisible={androidStatusBarVisible}
            backdropColor={backdropColor}
            ref={modal => {
              this.modal = modal;
            }}
          />
        </View>
      );
    }
  }

  Copilot.childContextTypes = {
    _copilot: PropTypes.object.isRequired,
  };

  return hoistStatics(Copilot, WrappedComponent);
};

export default copilot;
