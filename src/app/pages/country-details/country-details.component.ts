import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { ChartConfiguration } from 'chart.js';

// Interface pour les participations
interface Participation {
  id: number;
  year: number;
  city: string;
  medalsCount: number;
  athleteCount: number;
}

@Component({
  selector: 'app-country-details',
  templateUrl: './country-details.component.html',
  styleUrls: ['./country-details.component.scss'],
  standalone: false // Changer en false pour être cohérent avec les autres composants
})
export class CountryDetailsComponent implements OnInit {
  private readonly emptyLineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  public viewModel$: Observable<any> = of({
    status: 'loading',
    countryName: '',
    metrics: { entries: 0, medals: 0, athletes: 0 },
    chartData: this.emptyLineChartData
  });

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    layout: {
      padding: {
        top: 20, // Ajouter un padding en haut pour éviter que la courbe soit coupée
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        display: false,
      },
      tooltip: {
        enabled: true,
        titleAlign: 'center',
        boxHeight: 0,
        boxWidth: 0,
        displayColors: false, // Ne pas afficher la boîte de couleur
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} medals`;
          },
          title: (tooltipItems) => {
            // Afficher seulement l'année
            return tooltipItems[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
        },
        border: {
          display: false, // Supprimer la bordure de l'axe X
        },
        ticks: {
          display: true, // Garder les années affichées
          color: '#6b7280',
          font: {
            size: 14
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, // Supprimer les lignes de grille horizontales
        },
        border: {
          display: false, // Supprimer la bordure de l'axe Y
        },
        ticks: {
          display: true, // Supprimer l'affichage des nombres sur l'axe Y
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0,
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private olympicService: OlympicService
  ) {}

  ngOnInit(): void {
    // Simplification : utiliser la nouvelle méthode du service
    this.viewModel$ = this.route.paramMap.pipe(
      map((params) => {
        const rawId = params.get('id');
        if (rawId === null) {
          return null;
        }

        const parsed = Number(rawId);
        return Number.isNaN(parsed) ? null : parsed;
      }),
      switchMap((countryId) => {
        if (countryId === null) {
          return of({
            status: 'not-found',
            countryName: '',
            metrics: { entries: 0, medals: 0, athletes: 0 },
            chartData: this.emptyLineChartData
          });
        }

        // Déléguer toute la logique au service
        return this.olympicService.getCountryDetailsViewModel(countryId);
      })
    );
  }
}
