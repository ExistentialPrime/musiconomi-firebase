/* ------------------------------------------------------------------------
  Router Animates
  - Provides good looking page transitions when navigating
  - See Creating Animations part of the Tutorial at:
       https://coursetro.com/posts/code/32/Create-a-Full-Angular-Authentication-System-with-Firebase
       and https://medium.com/google-developer-experts/angular-2-animate-router-transitions-6de179e00204
  ------------------------------------------------------------------------- */

import {trigger, state, animate, style, transition} from '@angular/core';

export function moveIn() {
  return trigger('moveIn', [
    state('void', style({position: 'fixed', width: 'auto'}) ),
    state('*', style({position: 'fixed', width: 'auto'}) ),
    transition(':enter', [
      style({opacity:'0', transform: 'translateX(200px)'}),
      animate('.7s ease-in-out', style({opacity:'1', transform: 'translateX(0)'}))
    ]),
    transition(':leave', [
      style({opacity:'1', transform: 'translateX(0)'}),
      animate('.3s ease-in-out', style({opacity:'0', transform: 'translateX(-200px) translateY(140px)'}))
    ])
  ]);
}

export function fallIn() {
  return trigger('fallIn', [
    transition(':enter', [
      style({opacity:'0', transform: 'translateY(40px)'}),
      animate('.4s .2s ease-in-out', style({opacity:'1', transform: 'translateY(0)'}))
    ]),
    transition(':leave', [
      style({opacity:'1', transform: 'translateX(0)'}),
      animate('.3s ease-in-out', style({opacity:'0', transform: 'translateX(-200px)'}))
    ])
  ]);
}


export function fadeIn() {
  // trigger name for attaching this animation to an element using the [@triggerName] syntax
  return trigger('fadeIn', [
      transition(':enter', [
        // css styles at start of transition
        style({ opacity: 0 }),
        // animation and styles at end of transition
        animate('.8s', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({opacity:'1'}),
        animate('.8s', style({ opacity: 0 }))
      ])
  ]);
}
