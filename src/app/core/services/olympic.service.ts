import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Olympic } from '../models/Olympic';

@Injectable
({
  providedIn: 'root',
})

export class OlympicService 
{
  private olympicUrl = './assets/mock/olympic.json';

  private olympics$ = new BehaviorSubject<Olympic[] | null | undefined>
  (
    undefined
  );

  constructor(private http: HttpClient) {}

   /**
   * Déclenche une récupération des données olympiques et stocke le résultat
   * dans le BehaviourSubject, tout en exposant l'observable à l'appelant.
   */
  loadInitialData(): Observable<Olympic[] | null> 
  {
    return this.http.get<Olympic[]>(this.olympicUrl).pipe
    (
      tap((value) => this.olympics$.next(value)),

      catchError((error) => 
      {
        // Journalisation simple pour diagnostiquer l'échec de la requête.
        console.error(error);

        // On publie `null` afin que les composants sortent de l'état de chargement.
        this.olympics$.next(null);
        return of(null);
      })
    );
  }

  getOlympics(): Observable<OlympicCountry[]> {
    return this.olympics$.pipe(
      map((olympics) => olympics || []), // Remplace `null` ou `undefined` par un tableau vide
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
      map((olympics) => {
        if (!olympics || olympics === null) {
          return olympics;
        }

        // Une fois les données disponibles, on recherche le pays correspondant.
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
        // Si les données sont nulles ou non disponibles, retourner un modèle vide
        if (!olympics) {
          return {
            countriesCount: 0, // Aucun pays
            olympicsCount: 0, // Aucune participation
            chartData: { labels: [], datasets: [] }, // Pas de données pour le graphique
          };
        }

        // Calculer le nombre total de pays participants
        const countriesCount = olympics.length;

        // Calculer le nombre total de participations aux Jeux Olympiques
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
          countriesCount, // Nombre de pays participants
          olympicsCount, // Nombre total de participations
          chartData: {
            labels: chartLabels, // Labels pour le graphique (noms des pays)
            datasets: [
              {
                data: chartData, // Données pour le graphique (nombre de médailles)
                backgroundColor: chartLabels.map(() =>
                  // Générer une couleur aléatoire pour chaque segment
                  '#' + Math.floor(Math.random() * 16777215).toString(16)
                ),
                borderColor: '#ffffff', // Couleur de la bordure des segments
                borderWidth: 2, // Épaisseur de la bordure
                hoverOffset: 0, // CORRECTION : Désactiver le grossissement au survol
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
              label: 'Médailles',
              borderColor: '#2563EB',
              pointRadius: 0,
              tension: 0, // CORRECTION : Mettre à 0 pour avoir des lignes droites
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

interface OlympicParticipation {
  id: number;
  year: number;
  city: string;
  medalsCount: number;
  athleteCount: number;
}

export interface OlympicCountry {
  id: number;
  country: string;
  participations: OlympicParticipation[];
}
