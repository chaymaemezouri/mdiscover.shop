import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

@Injectable()
export class AdminAuthGuard extends AuthGuard('admin-jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Allow guests: missing/invalid token must not block the request.
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }
    return true;
  }

  handleRequest<T>(_err: Error | null, user: T): T | null {
    return user ?? null;
  }
}
