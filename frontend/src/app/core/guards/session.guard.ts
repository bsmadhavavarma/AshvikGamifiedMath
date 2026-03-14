import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlayerService } from '../services/player.service';

export const sessionGuard: CanActivateFn = () => {
  const playerService = inject(PlayerService);
  const router = inject(Router);

  if (playerService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
