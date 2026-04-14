import { Expose, Transform, TransformFnParams } from 'class-transformer';

export class ReportOutputDto {
  @Expose()
  id: number;
  @Expose()
  price: number;
  @Expose()
  make: string;
  @Expose()
  model: string;
  @Expose()
  year: number;
  @Expose()
  lng: number;
  @Expose()
  lat: number;
  @Expose()
  mileage: number;
  @Expose()
  approved: boolean;

  @Transform(
    ({ obj }: TransformFnParams) => (obj?.user?.id as number) ?? undefined, // NOTE: This will transform the userId to the id of the user.
  )
  @Expose()
  userId: number;
}
