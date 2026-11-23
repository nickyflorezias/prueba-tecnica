import { ChangeDetectionStrategy, Component, inject, Injector, afterNextRender } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {
  private readonly injector = inject(Injector);

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        afterNextRender(() => document.querySelector<HTMLElement>('h1')?.focus(), { injector: this.injector });
      });
  }
}