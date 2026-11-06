import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { AuroraTextField, type AuroraTextFieldProps } from '@/components/aurora/aurora-text-field';

export type FormAuroraTextFieldProps<T extends FieldValues> = Omit<
  AuroraTextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/** An AuroraTextField bound to react-hook-form. Validation errors show under the field. */
export function FormAuroraTextField<T extends FieldValues>({
  control,
  name,
  ...rest
}: FormAuroraTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AuroraTextField
          {...rest}
          ref={field.ref}
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
