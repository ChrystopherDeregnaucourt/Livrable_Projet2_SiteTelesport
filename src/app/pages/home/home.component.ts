import { Component, OnInit } from '@angular/core';
import { filter, map, Observable, of } from 'rxjs';
import { OlympicService, OlympicCountry } from 'src/app/core/services/olympic.service';
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
export class HomeComponent implements OnInit 
{
  public olympics$: Observable<OlympicCountry[]> = of([]);

  public viewModel$: Observable<HomeViewModel> = of({
    countriesCount: 0,
    olympicsCount: 0,
    chartData: { labels: [], datasets: [] },
  });

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = 
  {
    responsive: true,
    maintainAspectRatio: false,
    onResize: (chart, size) => {
      // Gérer l'affichage de la légende selon la taille
      const minWidthForCustomLabels = 600;
      if (chart.options.plugins?.legend) {
        chart.options.plugins.legend.display = size.width < minWidthForCustomLabels;
      }
    },
    onClick: (event, elements) => {
      // Vérifier qu'un élément a été cliqué
      if (elements.length > 0) {
        const element = elements[0];
        // Récupérer l'index du segment cliqué
        const segmentIndex = element.index;
        
        // Récupérer les données olympiques pour obtenir l'ID du pays
        this.olympics$.pipe(
          map(olympics => olympics[segmentIndex])
        ).subscribe(country => {
          if (country) {
            // Naviguer vers la page de détails du pays
            this.goToCountry(country.id);
          }
        });
      }
    },
    plugins: 
    {
      legend: 
      {
        display: false,
        position: 'bottom',
        labels: 
        {
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
      datalabels: 
      {
        display: false,
      },
      tooltip: 
      {
        enabled: false, // Désactiver le tooltip par défaut
        external: (context) => {
          // Créer notre tooltip personnalisé
          this.createCustomTooltip(context);
        },
        backgroundColor: '#04838f',
        titleFont: {
          family: '"Poppins", "Segoe UI", Arial, sans-serif',
          size: 16,
          weight: 600,
        },
        bodyFont: {
          family: '"Poppins", "Segoe UI", Arial, sans-serif',
          size: 14,
          weight: 400,
        },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
  };

  constructor(
    private readonly olympicService: OlympicService,
    private readonly router: Router
  ) {}

  ngOnInit(): void 
  {
    // Enregistrer seulement le plugin des labels
    Chart.register(ChartDataLabels, this.calloutLabelsPlugin);
    
    // Récupération des données des pays olympiques
    this.olympics$ = this.olympicService.getOlympics().pipe(
      filter((olympics) => olympics.length > 0)
    );

    // Utilisation de la méthode pour récupérer le modèle de vue
    this.viewModel$ = this.olympicService.getHomeViewModel();
  }

  // Méthode pour créer le tooltip personnalisé
  private createCustomTooltip(context: any): void {
    const { chart, tooltip } = context;

    // Récupérer ou créer l'élément tooltip
    let tooltipEl = chart.canvas.parentNode?.querySelector('div.chartjs-tooltip') as HTMLElement;

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.classList.add('chartjs-tooltip');
      tooltipEl.style.background = '#04838f';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.color = 'white';
      tooltipEl.style.opacity = '0';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transition = 'all 0.1s ease';
      tooltipEl.style.padding = '10px 15px';
      tooltipEl.style.fontFamily = "'Poppins', 'Segoe UI', Arial, sans-serif";
      tooltipEl.style.textAlign = 'center';
      tooltipEl.style.fontSize = '18px';
      tooltipEl.style.fontWeight = '400';
      tooltipEl.style.minWidth = '120px';
      tooltipEl.style.zIndex = '1000';
      
      // Ajouter une petite flèche pointant vers le bas
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.bottom = '-5px';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderLeft = '10px solid transparent';
      arrow.style.borderRight = '10px solid transparent';
      arrow.style.borderTop = '10px solid #04838f';
      arrow.classList.add('tooltip-arrow');
      tooltipEl.appendChild(arrow);

      chart.canvas.parentNode?.appendChild(tooltipEl);
    }

    // Masquer le tooltip si l'opacité est 0
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    // Construire le contenu du tooltip
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map((b: any) => b.lines);

      let innerHtml = '';

      // Ajouter le titre (nom du pays)
      titleLines.forEach((title: string) => {
        innerHtml += `<div style="font-weight: 600; font-size: 18px; margin-bottom: 5px;">${title}</div>`;
      });

      // Ajouter le contenu avec l'icône de médaille
      bodyLines.forEach((body: string[], i: number) => {
        const value = body[0];
        innerHtml += `
          <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
            <img src="assets/images/medal.png" alt="médaille" style="width: 20px; height: 25px;" />
            <span>${value}</span>
          </div>
        `;
      });

      // Sauvegarder la flèche avant de vider le contenu
      const existingArrow = tooltipEl.querySelector('.tooltip-arrow');
      tooltipEl.innerHTML = innerHtml;
      
      // Remettre la flèche
      if (existingArrow) 
      {
        tooltipEl.appendChild(existingArrow);
      } 
      else 
      {
        const arrow = document.createElement('div');
        arrow.classList.add('tooltip-arrow');
        tooltipEl.appendChild(arrow);
      }
    }

    // CORRECTION : Utiliser les vraies coordonnées de la souris
    const canvasRect = chart.canvas.getBoundingClientRect();
    
    // Calculer la position relative à la fenêtre
    const tooltipX = canvasRect.left + tooltip.caretX + window.scrollX;
    const tooltipY = canvasRect.top + tooltip.caretY + window.scrollY - tooltipEl.offsetHeight - 10;
    
    // Appliquer la position
    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = tooltipX + 'px';
    tooltipEl.style.top = tooltipY + 'px';
    tooltipEl.style.transform = 'translateX(-50%)'; // Centrer horizontalement seulement
  }

  public goToCountry(countryId: number): void 
  {
    this.router.navigate(['/country', countryId]);
  }

  private readonly calloutLabelsPlugin: Plugin<'pie'> = 
  {
    id: 'pieCalloutLabels',
    afterDatasetsDraw: (chart) => {
      const { ctx, data, chartArea } = chart;
      const dataset = data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!dataset || !meta?.data.length || !chartArea) {
        return;
      }

      // Déterminer si on a assez d'espace pour les labels personnalisés
      const minWidthForCustomLabels = 600;
      const chartWidth = chartArea.width;
      
      // CORRECTION : Supprimer l'appel à chart.update() pour éviter la boucle infinie
      // Si l'écran est trop petit, ne pas dessiner les labels personnalisés
      if (chartWidth < minWidthForCustomLabels) {
        return; // Sortir sans dessiner les labels personnalisés
      }

      // Dessiner les labels personnalisés seulement pour les grands écrans
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
        
        // Calcul de la longueur des lignes
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
        ctx.strokeStyle = segmentColor;
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

  // Supprimer le medalImagePlugin car nous n'en avons plus besoin

}

interface HomeViewModel {
  countriesCount: number;
  olympicsCount: number;
  chartData: ChartData<'pie', number[], string | string[]>;
}