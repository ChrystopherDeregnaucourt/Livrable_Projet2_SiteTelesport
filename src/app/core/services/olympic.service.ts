import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Olympic } from '../models/Olympic';

@Injectable
({
  providedIn: 'root',
})

// Service maison : il encapsule la récupération des données mockées et expose
// plusieurs ViewModels prêts à consommer côté composants
export class OlympicService
{
  private olympicUrl = './assets/mock/olympic.json';

  // Je m'appuie sur un BehaviorSubject pour mémoriser la requête passée (pas de requêtes multiples) :
  //   - `undefined` : chargement en cours
  //   - `null`      : échec du chargement
  //   - `Olympic[]` : données prêtes à l'emploi
  private olympics$ = new BehaviorSubject<Olympic[] | null | undefined>
  (
    undefined
  );

  constructor(private http: HttpClient) {}

  loadInitialData(): Observable<Olympic[] | null> 
  {
    return this.http.get<Olympic[]>(this.olympicUrl).pipe
    (
      tap((value) => this.olympics$.next(value)),

      catchError((error) =>
      {
        // log simple pour diagnostiquer l'échec de la requête.
        console.error(error);

        // On publie `null` afin que les composants sortent de l'état de chargement pour passer en
        // état d'erreur.
        this.olympics$.next(null);
        return of(null);
      })
    );
  }

  getOlympics(): Observable<OlympicCountry[]> 
  {
    //Si les données existent, on les retourne, sinon on retourne un tableau vide
    return this.olympics$.pipe(
      map((olympics) => olympics || []), 
    );
  }

  /**
   * Retourne le détail d'un pays à partir de son identifiant sans rompre la
   * gestion des états :
   *  - `undefined` si la récupération est toujours en cours
   *  - `null` en cas d'erreur globale
   *  - `Olympic` lorsque le pays est trouvé.
   */
  getOlympicById(id: number): Observable<Olympic | undefined | null> 
  {
    return this.olympics$.pipe(
      map((olympics) => 
      {
        if (!olympics || olympics === null) 
        {
          // Si les données sont nulles, on retourne tel quel afin d'éviter des erreurs de types "Cannot read property of null"
          return olympics;
        }

        return olympics.find((olympic) => olympic.id === id);
      })
    );
  }

  /**
   * Prépare les données nécessaires pour le modèle de vue de la page d'accueil.
   * Retourne un observable contenant les statistiques et les données pour le graphique.
   */
  getHomeViewModel(): Observable<
  {
    countriesCount: number;
    olympicsCount: number;
    chartData: 
    {
      labels: string[];
      datasets: 
      {
        data: number[];
        backgroundColor: string[];
        borderColor: string;
        borderWidth: number;
        hoverOffset: number;
      }[];
    };
  }> 
  {
    return this.getOlympics().pipe(
    map((olympics) => {
        if (!olympics) {
          return {
            countriesCount: 0,
            olympicsCount: 0,
            chartData: { labels: [], datasets: [] },
          };
        }

        // pays participants
        const countriesCount = olympics.length;

        // participations aux Jeux Olympiques
        const olympicsCount = olympics.reduce(
          (total, country) => total + country.participations.length,
          0
        );

        // Extraire les noms des pays pour les utiliser comme labels dans le graphique
        const chartLabels = olympics.map((country) => country.country);

        // Calculer le nombre total de médailles pour chaque pays
        const chartData = olympics.map((country) =>
          country.participations.reduce(
            (medalSum, participation) => medalSum + participation.medalsCount,
            0
          )
        );

        // Retourner les données formatées pour le graphique
        return {
          countriesCount,
          olympicsCount,
          chartData: {
            labels: chartLabels,
            datasets: [
              {
                data: chartData, // (nombre de médailles)
                backgroundColor: chartLabels.map(() =>
                  // Générer une couleur aléatoire pour chaque segment (origine = différents bleus = pas terrible)
                  '#' + Math.floor(Math.random() * 16777215).toString(16)
                ),
                borderWidth: 0, // Pas de bordure
                borderColor: '#ffffff',
                hoverOffset: 0, // Désactiver le grossissement au survol
              },
            ],
          },
        };
      })
    );
  }

  /**
   * Prépare les données nécessaires pour le modèle de vue de la page de détails d'un pays.
   * Retourne un observable contenant les informations du pays et les données pour le graphique linéaire.
   */
  getCountryDetailsViewModel(countryId: number): Observable<{
    status: 'loading' | 'ready' | 'not-found' | 'error';
    countryName: string;
    metrics: { entries: number; medals: number; athletes: number };
    chartData: any;
  }> {
    return this.olympics$.pipe(
      map((olympics) => {
        // Si les données sont undefined (en cours de chargement)
        if (olympics === undefined) {
          return {
            status: 'loading' as const,
            countryName: '',
            metrics: { entries: 0, medals: 0, athletes: 0 },
            chartData: { labels: [], datasets: [] }
          };
        }

        // Si les données sont null (erreur de chargement)
        if (olympics === null) {
          return {
            status: 'error' as const,
            countryName: '',
            metrics: { entries: 0, medals: 0, athletes: 0 },
            chartData: { labels: [], datasets: [] }
          };
        }

        // Rechercher le pays correspondant à l'ID
        const country = olympics.find((olympic) => olympic.id === countryId);

        // Si le pays n'est pas trouvé
        if (!country) {
          return {
            status: 'not-found' as const,
            countryName: '',
            metrics: { entries: 0, medals: 0, athletes: 0 },
            chartData: { labels: [], datasets: [] }
          };
        }

        // Trier les participations par année
        const participations = [...country.participations].sort(
          (a, b) => a.year - b.year
        );

        // Préparer les données pour le graphique linéaire
        const chartData = {
          labels: participations.map((participation) => participation.year.toString()),
          datasets: [
            {
              data: participations.map((participation) => participation.medalsCount),
              label: 'Dates',
              borderColor: '#2563EB',
              pointRadius: 0,
              tension: 0, //Mettre à 0 pour avoir des lignes droites
              fill: false,
            },
          ],
        };

        // Calculer les métriques
        const medals = participations.reduce(
          (total, participation) => total + participation.medalsCount,
          0
        );
        const athletes = participations.reduce(
          (total, participation) => total + participation.athleteCount,
          0
        );

        // Retourner les données complètes
        return {
          status: 'ready' as const,
          countryName: country.country,
          metrics: {
            entries: participations.length,
            medals,
            athletes,
          },
          chartData,
        };
      })
    );
  }

}

// Modèles spécifiques au service (pour éviter les dépendances circulaires)
interface OlympicParticipation {
  id: number;
  year: number;
  city: string;
  medalsCount: number;
  athleteCount: number;
}

// Représente un pays participant aux Jeux Olympiques avec ses participations
export interface OlympicCountry {
  id: number;
  country: string;
  participations: OlympicParticipation[];
}
