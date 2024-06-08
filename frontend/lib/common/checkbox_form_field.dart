import 'package:flutter/material.dart';

class CheckboxFormField extends FormField<bool> {
  CheckboxFormField({
    super.key,
    required FormFieldSetter<bool> super.onSaved,
    required FormFieldValidator<bool> super.validator,
    bool super.initialValue = false,
    required ValueChanged<bool> onChange,
    String title = '',
    bool autoValidate = false,
  }) : super(
          autovalidateMode: autoValidate
              ? AutovalidateMode.always
              : AutovalidateMode.disabled,
          builder: (FormFieldState<bool> state) {
            return CheckboxListTile(
              value: state.value ?? initialValue,
              title: Text(title),
              controlAffinity: ListTileControlAffinity.leading,
              onChanged: (bool? value) {
                state.didChange(value ?? false);
                onChange(value ?? false);
              },
            );
          },
        );
}
