import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { filter, map, Observable, of } from 'rxjs';
import { OlympicService, OlympicCountry } from 'src/app/core/services/olympic.service';
import { Router } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  ChartConfiguration,
  ChartData,
  Chart,
  Plugin,
} from 'chart.js';
import { DOCUMENT } from '@angular/common';

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
    private readonly router: Router,
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT) private readonly document: Document
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
      tooltipEl = this.renderer.createElement('div');
      this.renderer.addClass(tooltipEl, 'chartjs-tooltip');
      this.applyTooltipBaseStyles(tooltipEl);

      const parentNode = chart.canvas.parentNode as HTMLElement | null;
      if (parentNode) {
        this.renderer.appendChild(parentNode, tooltipEl);
      }
    }

    // Masquer le tooltip si l'opacité est 0
    if (tooltip.opacity === 0) {
      this.renderer.setStyle(tooltipEl, 'opacity', '0');
      return;
    }

    // Construire le contenu du tooltip
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map((b: any) => b.lines);
      this.updateTooltipContent(tooltipEl, titleLines, bodyLines);
    }

    // CORRECTION : Utiliser les vraies coordonnées de la souris
    const canvasRect = chart.canvas.getBoundingClientRect();

    // Calculer la position relative à la fenêtre
    const defaultView = this.document.defaultView;
    const scrollX = defaultView?.scrollX ?? 0;
    const scrollY = defaultView?.scrollY ?? 0;
    const tooltipX = canvasRect.left + tooltip.caretX + scrollX;
    const tooltipY = canvasRect.top + tooltip.caretY + scrollY - tooltipEl.offsetHeight - 10;

    // Appliquer la position
    this.renderer.setStyle(tooltipEl, 'opacity', '1');
    this.renderer.setStyle(tooltipEl, 'left', `${tooltipX}px`);
    this.renderer.setStyle(tooltipEl, 'top', `${tooltipY}px`);
    this.renderer.setStyle(tooltipEl, 'transform', 'translateX(-50%)');
  }

  public goToCountry(countryId: number): void
  {
    this.router.navigate(['/country', countryId]);
  }

  private applyTooltipBaseStyles(tooltipEl: HTMLElement): void
  {
    this.renderer.setStyle(tooltipEl, 'background', '#04838f');
    this.renderer.setStyle(tooltipEl, 'borderRadius', '8px');
    this.renderer.setStyle(tooltipEl, 'color', 'white');
    this.renderer.setStyle(tooltipEl, 'opacity', '0');
    this.renderer.setStyle(tooltipEl, 'pointerEvents', 'none');
    this.renderer.setStyle(tooltipEl, 'position', 'absolute');
    this.renderer.setStyle(tooltipEl, 'transition', 'all 0.1s ease');
    this.renderer.setStyle(tooltipEl, 'padding', '10px 15px');
    this.renderer.setStyle(tooltipEl, 'fontFamily', "'Poppins', 'Segoe UI', Arial, sans-serif");
    this.renderer.setStyle(tooltipEl, 'textAlign', 'center');
    this.renderer.setStyle(tooltipEl, 'fontSize', '18px');
    this.renderer.setStyle(tooltipEl, 'fontWeight', '400');
    this.renderer.setStyle(tooltipEl, 'minWidth', '120px');
    this.renderer.setStyle(tooltipEl, 'zIndex', '1000');
  }

  private updateTooltipContent(
    tooltipEl: HTMLElement,
    titleLines: string[],
    bodyLines: string[][]
  ): void {
    while (tooltipEl.firstChild) {
      this.renderer.removeChild(tooltipEl, tooltipEl.firstChild);
    }

    titleLines.forEach((title: string) => {
      const titleContainer = this.renderer.createElement('div');
      this.renderer.setStyle(titleContainer, 'fontWeight', '600');
      this.renderer.setStyle(titleContainer, 'fontSize', '18px');
      this.renderer.setStyle(titleContainer, 'marginBottom', '5px');

      const titleText = this.renderer.createText(title);
      this.renderer.appendChild(titleContainer, titleText);
      this.renderer.appendChild(tooltipEl, titleContainer);
    });

    bodyLines.forEach((body: string[]) => {
      if (!body.length) {
        return;
      }

      const row = this.renderer.createElement('div');
      this.renderer.setStyle(row, 'display', 'flex');
      this.renderer.setStyle(row, 'alignItems', 'center');
      this.renderer.setStyle(row, 'justifyContent', 'center');
      this.renderer.setStyle(row, 'gap', '5px');

      const medalIcon = this.renderer.createElement('img');
      this.renderer.setAttribute(medalIcon, 'src', 'assets/images/medal.png');
      this.renderer.setAttribute(medalIcon, 'alt', 'médaille');
      this.renderer.setStyle(medalIcon, 'width', '20px');
      this.renderer.setStyle(medalIcon, 'height', '25px');

      const valueSpan = this.renderer.createElement('span');
      const valueText = this.renderer.createText(body[0]);
      this.renderer.appendChild(valueSpan, valueText);

      this.renderer.appendChild(row, medalIcon);
      this.renderer.appendChild(row, valueSpan);
      this.renderer.appendChild(tooltipEl, row);
    });

    const arrow = this.renderer.createElement('div');
    this.renderer.addClass(arrow, 'tooltip-arrow');
    this.renderer.setStyle(arrow, 'position', 'absolute');
    this.renderer.setStyle(arrow, 'bottom', '-5px');
    this.renderer.setStyle(arrow, 'left', '50%');
    this.renderer.setStyle(arrow, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(arrow, 'width', '0');
    this.renderer.setStyle(arrow, 'height', '0');
    this.renderer.setStyle(arrow, 'borderLeft', '10px solid transparent');
    this.renderer.setStyle(arrow, 'borderRight', '10px solid transparent');
    this.renderer.setStyle(arrow, 'borderTop', '10px solid #04838f');

    this.renderer.appendChild(tooltipEl, arrow);
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