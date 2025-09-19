import { Component, OnInit } from '@angular/core';
import { filter, map, Observable, of } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { Router } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  ChartConfiguration,
  ChartData,
  Chart,
  Plugin,
  TooltipItem,
} from 'chart.js';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {
  public olympics$: Observable<OlympicCountry[]> = of([]);

  public viewModel$: Observable<HomeViewModel> = of({
    countriesCount: 0,
    olympicsCount: 0,
    chartData: { labels: [], datasets: [] },
  });

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Activé par défaut pour les petits écrans
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#1f2937',
          padding: 15,
          font: {
            family: '"Poppins", "Segoe UI", Arial, sans-serif',
            size: 12,
            weight: 500,
          },
        },
      },
      datalabels: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const label = context.label ?? '';
            return `${label}: ${context.raw} medals`;
          },
        },
      },
    },
  };

  private readonly calloutLabelsPlugin: Plugin<'pie'> = {
    id: 'pieCalloutLabels',
    afterDatasetsDraw: (chart) => {
      const { ctx, data, chartArea } = chart;
      const dataset = data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!dataset || !meta?.data.length || !chartArea) {
        return;
      }

      // Déterminer si on a assez d'espace pour les labels personnalisés
      const minWidthForCustomLabels = 600; // Largeur minimale requise
      const chartWidth = chartArea.width;
      
      // Si l'écran est trop petit, activer la légende classique et ne pas dessiner les labels personnalisés
      if (chartWidth < minWidthForCustomLabels) 
      {
        // Activer la légende classique
        if (chart.options.plugins?.legend) 
        {
          chart.options.plugins.legend.display = true;
        }
        return; // Ne pas dessiner les labels personnalisés
      } 
      else 
      {
        // Désactiver la légende classique pour les grands écrans
        if (chart.options.plugins?.legend) 
        {
          chart.options.plugins.legend.display = false;
        }
      }

      meta.data.forEach((element, index) => {
        const {
          x: centerX,
          y: centerY,
          startAngle,
          endAngle,
          outerRadius,
        } = element.getProps(['x', 'y', 'startAngle', 'endAngle', 'outerRadius'], true);

        const angle = (startAngle + endAngle) / 2;
        const radialGap = 0;
        const labelMargin = 32;
        const { left: chartLeft, right: chartRight } = chartArea;
        
        // Calcul de la longueur des lignes (plus conservateur)
        const availableWidth = chartWidth / 2;
        const maxLineLength = Math.max(50, Math.min(215, availableWidth - 150));
        
        const startX = centerX + Math.cos(angle) * outerRadius;
        const startY = centerY + Math.sin(angle) * outerRadius;
        const middleX = centerX + Math.cos(angle) * (outerRadius + radialGap);
        const middleY = centerY + Math.sin(angle) * (outerRadius + radialGap);
        const isRightSide = Math.cos(angle) >= 0;
        const endX = isRightSide
          ? chartRight + labelMargin
          : chartLeft - labelMargin;
        const endY = middleY;

        // Dessiner les lignes uniquement pour les grands écrans
        const lineEndX = isRightSide 
          ? endX - maxLineLength 
          : endX + maxLineLength;
        
        // Récupérer la couleur du quartier correspondant
        const backgroundColors = dataset.backgroundColor as string[]; 
        const segmentColor = backgroundColors?.[index] || '#94a3b8';
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(middleX, middleY);
        ctx.lineTo(lineEndX, endY);
        ctx.strokeStyle = segmentColor; // Utiliser la couleur du quartier
        ctx.lineWidth = 2;
        ctx.stroke();

        const label = data.labels?.[index] ?? 'Unknown';
        const text = `${label}`;

        ctx.font = "600 16px 'Poppins', 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = '#1f2937';
        ctx.textBaseline = 'middle';
        ctx.textAlign = isRightSide ? 'left' : 'right';
        
        // Position des labels
        const labelOffset = maxLineLength - 15;
        ctx.fillText(text, endX + (isRightSide ? -labelOffset : labelOffset), endY);
        ctx.restore();
      });
    },
  };

  constructor(
    private readonly olympicService: OlympicService,
    private readonly router: Router
  ) {}

  ngOnInit(): void
  {
    Chart.register(ChartDataLabels, this.calloutLabelsPlugin);

    this.olympics$ = this.olympicService.getOlympics().pipe
    (
      filter((olympics): olympics is OlympicCountry[] => olympics != null)
    );

    this.viewModel$ = this.olympics$.pipe(
      filter((olympics): olympics is OlympicCountry[] => Array.isArray(olympics)),
      map((olympics) => {
        const countriesCount = olympics.length;
        const olympicsCount = olympics.reduce(
          (total, country) => total + country.participations.length,
          0
        );
        const chartLabels = olympics.map((country) => country.country);
        const chartData = olympics.map((country) =>
          country.participations.reduce(
            (medalSum, participation) => medalSum + participation.medalsCount,
            0
          )
        );
        return {
          countriesCount,
          olympicsCount,
          chartData: {
            labels: chartLabels,
            datasets: [
              {
                data: chartData,
                backgroundColor: chartLabels.map(() => this.getRandomColor()),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 12,
              },
            ],
          } as ChartData<'pie', number[], string | string[]>,
        };
      })
    );
  }

  public goToCountry(countryId: number): void 
  {
    this.router.navigate(['/country', countryId]);
  }
  
  public getRandomColor() 
  {
    // Génère une couleur hexadécimale aléatoire
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  }
}

interface OlympicParticipation {
  id: number;
  year: number;
  city: string;
  medalsCount: number;
  athleteCount: number;
}

interface OlympicCountry {
  id: number;
  country: string;
  participations: OlympicParticipation[];
}

interface HomeViewModel {
  countriesCount: number;
  olympicsCount: number;
  chartData: ChartData<'pie', number[], string | string[]>;
}