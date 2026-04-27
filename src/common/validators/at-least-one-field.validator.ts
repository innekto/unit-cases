import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class AtLeastOneFieldConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const object = args.object as Record<string, any>;
    const fields: string[] = args.constraints[0];
    return fields.some((f) => object[f] !== undefined);
  }

  defaultMessage(args: ValidationArguments) {
    const fields: string[] = args.constraints[0];
    return `At least one of the following fields must be provided: ${fields.join(', ')}`;
  }
}

export const AtLeastOneField = (fields: string[], validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [fields],
      validator: AtLeastOneFieldConstraint,
    });
  };
};
