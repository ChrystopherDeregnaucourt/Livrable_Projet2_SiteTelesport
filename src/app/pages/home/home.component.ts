import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { catchError, filter, map, Observable, of, take } from 'rxjs';
import { OlympicService, OlympicCountry } from 'src/app/core/services/olympic.service';
import { Router } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  ChartConfiguration,
  ChartData,
  Chart,
  Plugin,
  TooltipModel,
  TooltipItem,
} from 'chart.js';
import { DOCUMENT } from '@angular/common';

// Interface pour typer le contexte du tooltip
interface TooltipContext {
  chart: Chart;
  tooltip: TooltipModel<'pie'>;
}

// Interface pour typer les éléments du body du tooltip
interface TooltipBodyItem {
  lines: string[];
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit
{
  // Observable exposant directement la liste brute pour certaines interactions
  // (ex : clic sur un segment du camembert). L'initialisation à un tableau vide
  // facilite l'utilisation dans le template sans vérifications excessives.
  public olympics$: Observable<OlympicCountry[]> = of([]);

  // ViewModel complet qui alimente l'UI
  public viewModel$: Observable<HomeViewModel> = of({
    countriesCount: 0,
    olympicsCount: 0,
    chartData: { labels: [], datasets: [] },
  });

  // Plugin pour dessiner des lignes de rappel (callout) depuis les labels
  public pieChartOptions: ChartConfiguration<'pie'>['options'] =
  {
    responsive: true,
    maintainAspectRatio: false,
    onResize: (chart, size) => {
      // Gérer l'affichage de la légende selon la taille
      const minWidthForCustomLabels = 600;

      if (chart.options.plugins?.legend) 
      {
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
          map(olympics => olympics[segmentIndex]),
          catchError(() => of(null)), // Gérer le cas où l'index est hors limites
          take(1)//Comme je fais une souscription manuelle, je fais un take(1) pour éviter les fuites mémoires (ça veut dire que je prends une seule valeur et je me désabonne)
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
            family: '"Montserrat", sans-serif',
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
        external: (context: TooltipContext) => {
          this.createCustomTooltip(context);
        },
        backgroundColor: '#04838f',
        titleFont: {
          family: '"Montserrat", sans-serif',
          size: 16,
          weight: 600,
        },
        bodyFont: {
          family: '"Montserrat", sans-serif',
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
  private createCustomTooltip(context: TooltipContext): void {
    const { chart, tooltip } = context;

    // Récupérer ou créer l'élément tooltip
    let tooltipEl = chart.canvas.parentNode?.querySelector('div.chartjs-tooltip') as HTMLElement;

    if (!tooltipEl) {
      tooltipEl = this.renderer.createElement('div');//Création d'un elmt avec renderer2 (plus secure que le innerHTML)
      this.renderer.addClass(tooltipEl, 'chartjs-tooltip');
      this.applyTooltipBaseStyles(tooltipEl);

      const parentNode = chart.canvas.parentNode as HTMLElement | null;
      if (parentNode) {
        this.renderer.appendChild(parentNode, tooltipEl);
      }
    }

    // Masquer le tooltip si l'opacité est 0 (quand la souris part du quartier de camembert)
    if (tooltip.opacity === 0) {
      this.renderer.setStyle(tooltipEl, 'opacity', '0');
      return;
    }

    // Construire le contenu du tooltip
    if (tooltip.body) {//On vérifie que la tooltip à un contenu à afficher pour ne pas planter
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map((bodyItem: TooltipBodyItem) => bodyItem.lines);
      this.updateTooltipContent(tooltipEl, titleLines, bodyLines);
    }

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
    // Navigation programmatique : le composant reste ainsi indépendant du HTML.
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

  private updateTooltipContent
  (
    tooltipEl: HTMLElement,
    titleLines: string[],
    bodyLines: string[][]
  ): void 
  {
    //On vide la tooltip avant de la remplir
    while (tooltipEl.firstChild) 
    {
      this.renderer.removeChild(tooltipEl, tooltipEl.firstChild);
    }

    titleLines.forEach((title: string) => 
    {
      const titleContainer = this.renderer.createElement('div');
      this.renderer.setStyle(titleContainer, 'fontWeight', '600');
      this.renderer.setStyle(titleContainer, 'fontSize', '18px');
      this.renderer.setStyle(titleContainer, 'marginBottom', '5px');

      const titleText = this.renderer.createText(title);
      this.renderer.appendChild(titleContainer, titleText);
      this.renderer.appendChild(tooltipEl, titleContainer);
    });

    bodyLines.forEach((body: string[]) => 
    {
      if (!body.length) 
      {
        return;
      }

      const row = this.renderer.createElement('div');
      this.renderer.setStyle(row, 'display', 'flex');
      this.renderer.setStyle(row, 'alignItems', 'center');
      this.renderer.setStyle(row, 'justifyContent', 'center');
      this.renderer.setStyle(row, 'gap', '5px');

      // Ajouter l'icône de médaille avant le texte
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

    // Ajouter une flèche en bas du tooltip
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

  // Plugin pour dessiner des labels avec des lignes (legende)
  private readonly calloutLabelsPlugin: Plugin<'pie'> =
  {
    id: 'pieCalloutLabels',
    //afterDatasetsDraw afin d'attendre que le graphique soit dessiné avant d'ajouter nos labels
    afterDatasetsDraw: (chart) => 
    {
      //utilisation de la desctucturation pour récupérer les éléments nécessaires au dessin (context, donées, zone du graphique)
      const { ctx, data, chartArea } = chart;
      const dataset = data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!dataset || !meta?.data.length || !chartArea) {
        return;
      }

      // Astuce : je garde ce plugin maison pour dessiner des étiquettes en
      // dehors du graphique uniquement lorsque l'espace disponible le permet. (ici > 600px)
      const minWidthForCustomLabels = 600;
      const chartWidth = chartArea.width;
      
      // Si l'écran est trop petit, ne pas dessiner les labels personnalisés
      if (chartWidth < minWidthForCustomLabels) {
        return; // Sortir sans dessiner les labels personnalisés
      }

      // Dessiner les labels personnalisés seulement pour les grands écrans
      meta.data.forEach((element, index) => 
      {
        // Récupérer les propriétés nécessaires de chaque segment du camembert
        const 
        {
          x: centerX,
          y: centerY,
          startAngle,
          endAngle,
          outerRadius,
        } = element.getProps(['x', 'y', 'startAngle', 'endAngle', 'outerRadius'], true);

        // Calculer la position de chaque label
        const angle = (startAngle + endAngle) / 2;
        //radialGap = espace entre le bord du camembert et le début de la ligne
        const radialGap = -1;
        const labelMargin = 32;
        // Récupérer les bords gauche et droit de la zone du graphique et les renommer pour plus de clareté 
        const { left: chartLeft, right: chartRight } = chartArea;
        
        // Calcul de la longueur des lignes
        const availableWidth = chartWidth / 2;
        const maxLineLength = Math.max(50, Math.min(215, availableWidth - 150));
        
        //Math.cos(angle) et Math.sin(angle) donnent la direction
        //outerRadius est la distance depuis le centre jusqu'au bord du camembert
        //On ajoute centerX et centerY pour partir du centre du graphique
        const startX = centerX + Math.cos(angle) * outerRadius;
        const startY = centerY + Math.sin(angle) * outerRadius;
        const middleX = centerX + Math.cos(angle) * (outerRadius + radialGap);
        const middleY = centerY + Math.sin(angle) * (outerRadius + radialGap);
        const isRightSide = Math.cos(angle) >= 0;

        // Position finale du label
        const endX = isRightSide
          ? chartRight + labelMargin
          : chartLeft - labelMargin;
        const endY = middleY;

        // Position finale de la ligne avant le label
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

        ctx.font = "600 16px 'Montserrat', sans-serif";
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
}

// Interface pour typer le ViewModel de la page d'accueil
interface HomeViewModel {
  countriesCount: number;
  olympicsCount: number;
  chartData: ChartData<'pie', number[], string | string[]>;
}