import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ControllerSuccess, buildSuccessResponse } from '../utils/response.util';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response: ControllerSuccess<unknown> | unknown) => {
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'successCode' in response
        ) {
          const typed = response as ControllerSuccess<unknown>;
          return buildSuccessResponse(typed.data, typed.successCode);
        }

        return buildSuccessResponse(response);
      }),
    );
  }
}

