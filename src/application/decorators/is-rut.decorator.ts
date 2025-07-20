import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { RutValidator } from '../../utils/rut-validator';

export function IsRut(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRut',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          return RutValidator.isValid(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Chilean RUT in format XX.XXX.XXX-X`;
        },
      },
    });
  };
}
