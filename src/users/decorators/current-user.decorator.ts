import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    // NOTE: In data we get arguments passed to the decorator.
    const request = context.switchToHttp().getRequest(); // NOTE: context is the wrapper around the incoming request objects.
    return request.currentUser;
  },
);
