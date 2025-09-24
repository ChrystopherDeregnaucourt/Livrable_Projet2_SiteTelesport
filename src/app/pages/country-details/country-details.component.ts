import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { ChartConfiguration } from 'chart.js';

// Interface pour les métriques du pays
interface CountryMetrics {
  entries: number;
  medals: number;
  athletes: number;
}

// Interface pour le ViewModel du composant
interface CountryDetailsViewModel {
  status: 'loading' | 'ready' | 'error' | 'not-found';
  countryName: string;
  metrics: CountryMetrics;
  chartData: ChartConfiguration<'line'>['data'];
}

@Component({
  selector: 'app-country-details',
  templateUrl: './country-details.component.html',
  styleUrls: ['./country-details.component.scss'],
  standalone: false
})
export class CountryDetailsComponent implements OnInit 
{
  // Valeur par défaut pour les données du graphique (utile pour l'état de chargement et les erreurs)
  private readonly emptyLineChartData: ChartConfiguration<'line'>['data'] = 
  {
    labels: [],
    datasets: [],
  };

  public viewModel$: Observable<CountryDetailsViewModel> = of({
    status: 'loading',
    countryName: '',
    metrics: { entries: 0, medals: 0, athletes: 0 },
    chartData: this.emptyLineChartData
  });

  public lineChartOptions: ChartConfiguration<'line'>['options'] = 
  {
    responsive: true,
    maintainAspectRatio: true,
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: 
        {
          boxWidth: 0, // On affiche pas les boîtes de couleur
          boxHeight: 0,
          font: {
            size: 30, 
            family: 'Montserrat, sans-serif'
          },
          color: '#898f9bff'
        }
      },
      datalabels: {
        display: false,
      },
      tooltip: { //tooltip pas demandée dans la maquette mais configurée dans le doute
        enabled: false,
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
          color: '#000000ff',
        },
        border: {
          display: false, // Supprimer la bordure de l'axe X
        },
        ticks: {
          display: true, // Garder les années affichées
          color: '#000000ff',
          font: {
            size: 14
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, 
          color: '#000000ff',
        },
        border: {
          display: false, // Supprimer la bordure de l'axe Y
        },
        ticks: {
          display: true, // Supprimer l'affichage des nombres sur l'axe Y
          color: '#000000ff',
          font: {
            size: 14
          }
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
    //On écoute les changements de paramètres dans l'URL (si /country/5, on récupère automatiquement id = 5)
    this.viewModel$ = this.route.paramMap.pipe(
      // On extrait et parse l'ID du pays depuis les paramètres de l'URL
      map((params) => 
      {
        const rawId = params.get('id');
        if (rawId === null) {
          return null;
        }

        // On tente de parser l'ID en nombre (URL = texte)
        const parsed = Number(rawId);
        return Number.isNaN(parsed) ? null : parsed;
      }),

      //utilisation de switchMap afin d'annuler une éventuelle requête en cours si l'utilisateur change d'ID rapidement
      switchMap((countryId): Observable<CountryDetailsViewModel> => 
      {
        // Si l'ID est invalide, on retourne un état "not-found"
        if (countryId === null) {
          return of({
            status: 'not-found',
            countryName: '',
            metrics: { entries: 0, medals: 0, athletes: 0 },
            chartData: this.emptyLineChartData
          });
        }

        // Pour un ID valide, on délègue au service la création du ViewModel
        return this.olympicService.getCountryDetailsViewModel(countryId);
      })
    );
  }
}
