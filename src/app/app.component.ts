import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { take } from 'rxjs';
import { OlympicService } from './core/services/olympic.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,//Partage des styles
    standalone: false
})
export class AppComponent implements OnInit {
  // Note perso : je centralise ici l'appel initial pour conserver un point d'entrée unique
  constructor(private olympicService: OlympicService) {}

  ngOnInit(): void {
    // On déclenche une unique requête (via `take(1)`) au démarrage afin que le
    // service mette en cache les données pour le reste de l'application.
    this.olympicService.loadInitialData().pipe(take(1)).subscribe();
  }
}
