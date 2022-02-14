import {
  createSymbol,
  dedupeArray,
  isBoolean,
  isDefined,
  isNil,
  isNumber,
  isPrimitive,
  isString,
  noop,
} from '@showroomjs/core';
import {
  createNameContext,
  NumberInput,
  useId,
  useQueryParams,
} from '@showroomjs/ui';
import { useQuery, useQueryClient } from '@showroomjs/bundles/query';
import * as React from 'react';
import { ComponentDoc } from 'react-docgen-typescript';
import { findBestMatch } from 'string-similarity';
import { isType, useComponentMeta } from './component-props-context';
import { safeCompress, safeDecompress } from './compress';
import { parseSafely, stringifySafely } from './parse-safely';

export type ControlType =
  | 'checkbox'
  | 'text'
  | 'object'
  | 'file'
  | 'number'
  | 'date'
  | 'color';

export const NonLiteralValue = createSymbol('NonLiteral');

export interface UsePropsEditorOptions {
  initialProps?: Record<string, any>;
  controls?: Record<string, PropsEditorControlDef | ControlType | undefined>;
  includes?: Array<string>;
}

export type PropsEditorControlData = PropsEditorControl & {
  value: any;
  setValue: (val: any, index?: number) => void;
};

/**
 *
 * @param state
 * @param id
 * @param dispatch
 * @param controls the controls config to be used. This is important as some config cannot be serialized.
 * @param includes
 * @returns
 */
const stateToEditor = (
  state: PropsEditorState,
  id: string,
  dispatch: (event: {
    type: 'setValue';
    prop: string;
    value: any;
    index?: number;
  }) => void,
  controls = state.controls,
  includes?: Array<string>
) => {
  const props = { ...state.values };

  Object.entries(state.values).forEach(([prop, value]) => {
    const control = controls.find((ctrl) => ctrl.key === prop);

    if (control) {
      if (control.type === 'number') {
        props[prop] = NumberInput.getNumberValue(value);
      }

      if (
        control.type === 'select' &&
        state.propWithValueEncodedWithIndex.includes(prop)
      ) {
        const currentValue = props[prop];

        if (isNumber(currentValue)) {
          const selectedOption = control.options[currentValue];

          if (selectedOption) {
            props[prop] = selectedOption.value;
          }
        }
      }
    }
  });

  return {
    props,
    controls: (includes
      ? controls.filter((ctrl) => includes.includes(ctrl.key))
      : controls
    ).map((ctrl): PropsEditorControlData => {
      const value = (function getValue() {
        const stateValue = state.values[ctrl.key];
        if (ctrl.type !== 'select') {
          return stateValue;
        }

        if (
          !isNumber(stateValue) ||
          !state.propWithValueEncodedWithIndex.includes(ctrl.key)
        ) {
          return stateValue;
        }

        const selectedOption = ctrl.options[stateValue];

        if (!selectedOption) {
          return stateValue;
        }

        return selectedOption.value;
      })();

      return {
        ...ctrl,
        key: `${id}${ctrl.key}`,
        value,
        setValue: (value: any, index?: number) =>
          dispatch({
            type: 'setValue',
            prop: ctrl.label,
            value,
            index,
          }),
      };
    }),
  };
};

export const usePropsEditor = ({
  initialProps = {},
  controls: providedControls = {},
  includes,
}: UsePropsEditorOptions = {}) => {
  const controls = normalizeControls(providedControls);

  const componentMeta = useComponentMeta();
  const id = useId();

  const config = React.useMemo(
    () =>
      computeConfig({
        componentMeta,
        initialProps,
        controls,
      }),
    []
  );

  const [_state, _dispatch] = React.useReducer(propsEditorReducer, config);

  const injectedEditor = React.useContext(PropsEditorContext);

  const state = injectedEditor[0] ? injectedEditor[0] : _state;
  const dispatch = injectedEditor[0] ? injectedEditor[1] : _dispatch;

  React.useEffect(() => {
    injectedEditor[1]({
      type: 'init',
      initialState: _state,
    });
  }, []);

  return stateToEditor(state, id, dispatch, config.controls, includes);
};

const normalizeControls = (
  provided: Record<string, PropsEditorControlDef | ControlType | undefined>
): Record<string, PropsEditorControlDef | undefined> => {
  const result: Record<string, PropsEditorControlDef | undefined> = {};

  Object.keys(provided).forEach((prop) => {
    const config = provided[prop];

    if (isString(config)) {
      result[prop] = {
        type: config,
      };
    } else if (config && config.type === 'select') {
      result[prop] = {
        ...config,
        options: Array.isArray(config.options)
          ? config.options.map(({ type = 'literal', value, label }) => ({
              type,
              value,
              label,
            }))
          : config.options,
      };
    } else {
      result[prop] = config;
    }
  });

  return result;
};

export interface SelectOption {
  label: string;
  value: any;
  type: 'literal' | ControlType;
}

export interface EditorControlBase {
  label: string;
  key: string;
}

export type PropsEditorControlDef =
  | {
      type: 'checkbox';
    }
  | {
      type: 'select';
      options: Array<SelectOption>;
    }
  | {
      type: 'text';
    }
  | {
      type: 'number';
    }
  | {
      type: 'object';
    }
  | {
      type: 'file';
    }
  | {
      type: 'date';
    }
  | {
      type: 'color';
    };

export type PropsEditorControl = EditorControlBase & PropsEditorControlDef;

export interface PropsEditorState {
  controls: Array<PropsEditorControl>;
  values: Record<string, any>;
  propWithValueEncodedWithIndex: Array<string>;
}

type PropsEditorEvent = {
  type: 'setValue';
  prop: string;
  value: any;
  index?: number;
};

interface ComputeConfigOptions {
  componentMeta: ComponentDoc | undefined;
  initialProps: Record<string, any>;
  controls: Record<string, PropsEditorControlDef | undefined>;
}

function computeConfig({
  componentMeta,
  initialProps,
  controls: controlOverrides,
}: ComputeConfigOptions): PropsEditorState {
  const controls: Array<PropsEditorControl> = [];
  const values: Record<string, any> = { ...initialProps };
  const propWithValueEncodedWithIndex: Array<string> = [];

  if (!componentMeta) {
    Object.entries(controlOverrides).forEach(([key, config]) => {
      if (isDefined(config)) {
        addPropControl(config, {
          name: key,
          initialValue: initialProps[key],
          required: true,
        });
      }
    });

    return {
      controls,
      values,
      propWithValueEncodedWithIndex,
    };
  }

  const propItems = Object.values(componentMeta.props);

  function addPropControl(
    config: PropsEditorControlDef,
    prop: {
      name: string;
      initialValue: any;
      required: boolean;
    }
  ) {
    if (config.type !== 'select') {
      controls.push({
        ...config,
        label: prop.name,
        key: prop.name,
      });
    }

    if (config.type === 'text' && isString(prop.initialValue)) {
      values[prop.name] = prop.initialValue;
    }

    if (config.type === 'number' && isNumber(prop.initialValue)) {
      values[prop.name] = prop.initialValue;
    }

    if (config.type === 'checkbox' && isBoolean(prop.initialValue)) {
      values[prop.name] = prop.initialValue;
    }

    if (config.type === 'select') {
      if (config.options.length > 0) {
        const optionsWithType = config.options.map(
          ({ type = 'literal', value, label }) => ({
            value,
            label,
            type,
          })
        );

        const nullOptionIndex = optionsWithType.findIndex(
          (opt) => opt.value === null
        );

        const defaultOptions: Array<SelectOption> =
          prop.required && nullOptionIndex === -1
            ? []
            : [
                {
                  value: nullOptionIndex !== -1 ? null : undefined,
                  label: '(none)',
                  type: 'literal',
                },
              ];

        const selectControlConfig: PropsEditorControl = {
          type: 'select',
          label: prop.name,
          key: prop.name,
          options: defaultOptions.concat(
            nullOptionIndex === -1
              ? optionsWithType
              : optionsWithType.filter((opt) => opt.value !== null)
          ),
        };

        controls.push(selectControlConfig);

        if (
          isDefined(prop.initialValue) &&
          config.options.some((opt) => opt.value === prop.initialValue)
        ) {
          values[prop.name] = selectControlConfig.options.findIndex(
            (opt) => opt.value === prop.initialValue
          );
          propWithValueEncodedWithIndex.push(prop.name);
        }

        if (prop.required && !isDefined(values[prop.name])) {
          values[prop.name] = 0;
          propWithValueEncodedWithIndex.push(prop.name);
        }
      }
    }
  }

  propItems.forEach((prop) => {
    const isDeprecated = prop.tags && hasProperty(prop.tags, 'deprecated');

    if (isDeprecated) {
      return;
    }

    const initialValue = (function getInitialValue() {
      if (hasProperty(initialProps, prop.name)) {
        return initialProps[prop.name];
      }
      const declaredDefaultValue = prop.defaultValue && prop.defaultValue.value;

      return !isNil(declaredDefaultValue) ? declaredDefaultValue : undefined;
    })();

    const override = controlOverrides[prop.name];

    const addOptions = {
      ...prop,
      initialValue,
    };

    if (override) {
      if (isValidControlConfig(override)) {
        addPropControl(override, addOptions);
        return;
      }
    }

    if (isType(prop, 'string')) {
      addPropControl({ type: 'text' }, addOptions);
      return;
    }

    if (isType(prop, 'number')) {
      addPropControl({ type: 'number' }, addOptions);
      return;
    }

    if (isType(prop, 'boolean')) {
      addPropControl({ type: 'checkbox' }, addOptions);
      return;
    }

    if (isType(prop, 'File')) {
      addPropControl({ type: 'file' }, addOptions);
      return;
    }

    if (isType(prop, 'Date')) {
      addPropControl({ type: 'date' }, addOptions);
      return;
    }

    if (prop.type.name === 'enum') {
      if (prop.type.raw === 'ReactNode') {
        return;
      }

      const optionValues = prop.type.value;

      const parseOptions = Array.isArray(optionValues)
        ? optionValues
            .map((opt): Omit<SelectOption, 'label'> | undefined => {
              const literalValue = parseSafely(opt.value);

              if (isDefined(literalValue)) {
                return {
                  value: literalValue,
                  type: 'literal',
                };
              }

              const controlType = controlByTypeMap[opt.value];

              if (controlType) {
                return {
                  value: NonLiteralValue,
                  type: controlType,
                };
              }
            })
            .filter(isDefined)
        : [];

      if (parseOptions.length > 0) {
        const options = parseOptions.map((opt) => ({
          ...opt,
          label: opt.type === 'literal' ? String(opt.value) : `(${opt.type})`,
        }));

        addPropControl(
          {
            type: 'select',
            options,
          },
          addOptions
        );
      }
      return;
    }
  });

  const additionalControls = Object.entries(controlOverrides).filter(
    ([key]) => !propItems.some((prop) => prop.name === key)
  );

  additionalControls.forEach(([propName, control]) => {
    if (isDefined(control)) {
      if (isValidControlConfig(control)) {
        controls.push({
          ...control,
          label: propName,
          key: propName,
        });
      }
    }
  });

  return {
    controls,
    values,
    propWithValueEncodedWithIndex,
  };
}

const VALID_TYPES: Array<PropsEditorControlDef['type']> = [
  'checkbox',
  'text',
  'object',
  'file',
  'number',
  'select',
  'date',
  'color',
];

const controlByTypeMap: Record<string, ControlType | undefined> = {
  string: 'text',
  number: 'number',
  boolean: 'checkbox',
  object: 'object',
  File: 'file',
  Date: 'date',
};

const isValidControlConfig = (controlConfig: PropsEditorControlDef) => {
  if (
    ['checkbox', 'text', 'object', 'number', 'file', 'date', 'color'].includes(
      controlConfig.type
    )
  ) {
    return true;
  }

  if (controlConfig.type === 'select') {
    if (
      Array.isArray(controlConfig.options) &&
      controlConfig.options.length > 0 &&
      controlConfig.options.every((option) => isString(option.label))
    ) {
      return true;
    } else {
      console.warn(`options must be Array of label/value if type is 'select'.`);
      return false;
    }
  }

  const bestMatch =
    controlConfig.type && findBestMatch(controlConfig.type, VALID_TYPES);

  let warningMessage = `'${controlConfig.type}' is not a supported type for control.`;

  if (bestMatch.bestMatch && bestMatch.bestMatch.rating > 0.4) {
    warningMessage += `\nDo you mean to use '${bestMatch.bestMatch.target}'?`;
  }

  console.warn(warningMessage);

  return false;
};

const propsEditorReducer = (
  state: PropsEditorState,
  event: PropsEditorEvent
): PropsEditorState => {
  switch (event.type) {
    case 'setValue':
      return reduceNextStateForValue(state, event);

    default:
      return state;
  }
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

const hasProperty = (obj: Record<string, unknown>, property: string) =>
  hasOwnProperty.call(obj, property);

type PropsEditorProviderEvent =
  | {
      type: 'init';
      initialState: PropsEditorState;
    }
  | {
      type: 'setValue';
      prop: string;
      value: any;
      index?: number;
    };

const reduceNextStateForValue = (
  state: PropsEditorState,
  event: {
    type: 'setValue';
    prop: string;
    value: any;
    index?: number;
  }
) => {
  const useValueIndex = isNumber(event.index);

  return {
    ...state,
    values: {
      ...state.values,
      [event.prop]: useValueIndex ? event.index : event.value,
    },
    propWithValueEncodedWithIndex: useValueIndex
      ? dedupeArray(state.propWithValueEncodedWithIndex.concat(event.prop))
      : state.propWithValueEncodedWithIndex.filter((p) => p !== event.prop),
  };
};

const propsEditorProviderReducer = (
  state: PropsEditorState | undefined,
  event: PropsEditorProviderEvent
): PropsEditorState | undefined => {
  switch (event.type) {
    case 'init':
      return state || event.initialState;

    case 'setValue':
      return state && reduceNextStateForValue(state, event);

    default:
      return state;
  }
};

const usePropsEditorProviderState = (initialState?: PropsEditorState) =>
  React.useReducer(propsEditorProviderReducer, initialState);

export type PropsEditorContextType = ReturnType<
  typeof usePropsEditorProviderState
>;

export const PropsEditorContext = createNameContext<PropsEditorContextType>(
  'PropsEditorContext',
  [undefined, noop]
);

export const PropsEditorProvider = (props: {
  children: React.ReactNode;
  serializeToParam?: boolean;
  codeHash?: string;
}) => {
  const queryClient = useQueryClient();

  const propsEditorCache = useQuery<PropsEditorState>({
    enabled: false,
    queryKey: props.codeHash && getQueryKey(props.codeHash),
  });

  const [editorState, dispatch] = usePropsEditorProviderState(
    propsEditorCache.data
  );

  const [params, setParams] = useQueryParams();

  React.useEffect(() => {
    if (props.serializeToParam) {
      const serializedProps = params.get('props');

      if (serializedProps) {
        const result = safeDecompress(serializedProps, '');
        const initialState = result && parseSafely<PropsEditorState>(result);

        if (initialState) {
          dispatch({
            type: 'init',
            initialState,
          });
        }
      }
    }
  }, [props.serializeToParam]);

  React.useEffect(() => {
    if (props.serializeToParam && editorState) {
      const serialized = stringifySafely(editorState);

      if (serialized) {
        setParams(
          {
            props: safeCompress(serialized),
          },
          {
            merge: true,
          }
        );
      }
    }
  }, [editorState, props.serializeToParam]);

  const dispatchCb = React.useCallback(
    (event: PropsEditorProviderEvent) => {
      dispatch(event);

      if (event.type === 'init' && props.codeHash) {
        queryClient.setQueryData(
          getQueryKey(props.codeHash),
          event.initialState
        );
      }
    },
    [props.codeHash]
  );

  return (
    <PropsEditorContext.Provider value={[editorState, dispatchCb]}>
      {props.children}
    </PropsEditorContext.Provider>
  );
};

const getQueryKey = (codeHash: string) => [`propsEditor`, codeHash];

export const usePropsEditorContext = () => {
  const [state, dispatch] = React.useContext(PropsEditorContext);
  const id = useId();

  if (state) {
    return stateToEditor(state, id, dispatch);
  }
};

const serializedSymbol = createSymbol('serialized');

/**
 * serialized props editor state so it can be safely posted
 * via postMessage.
 */
export const serializePropsEditor = (
  state: PropsEditorState
): PropsEditorState => {
  const values = { ...state.values };

  return {
    ...state,
    values,
    controls: state.controls.map((ctrl) =>
      ctrl.type === 'select'
        ? {
            ...ctrl,
            options: ctrl.options.map((m, i) =>
              isPrimitive(m.value)
                ? m
                : {
                    ...m,
                    value: `${serializedSymbol}${i}`,
                  }
            ),
          }
        : ctrl
    ),
  };
};
