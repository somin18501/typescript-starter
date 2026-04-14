import { IsString } from 'class-validator'; // This is a decorator that validates the data type of the property.

export class CreateMessageDto {
  @IsString()
  content: string;
}
