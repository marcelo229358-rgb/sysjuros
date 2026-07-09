import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

export interface BillingPlanItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  planFeatures?: { feature: { code: string; name: string } }[];
}

interface Props {
  plans: BillingPlanItem[];
  highlight?: string;
  onSelect?: (slug: string) => void;
  showSelect?: boolean;
}

const SLUG_VARIANT: Record<string, string> = {
  basico: 'billing-plan-basic',
  pro: 'billing-plan-pro',
  premium: 'billing-plan-premium',
};

export function BillingPlanCards({ plans, highlight, onSelect, showSelect }: Props) {
  const commercial = plans.filter((p) => p.slug !== 'trial');

  return (
    <div className="row g-3">
      {commercial.map((plan) => {
        const isHighlight = highlight === plan.slug || plan.slug === 'pro';
        const features = plan.planFeatures?.map((pf) => pf.feature.name) ?? [];

        return (
          <div key={plan.id} className="col-md-4">
            <Card className={`billing-plan-card h-100 ${SLUG_VARIANT[plan.slug] ?? ''} ${isHighlight ? 'featured' : ''}`}>
              {isHighlight && <div className="billing-plan-badge">Mais popular</div>}
              <Card.Body className="d-flex flex-column">
                <Card.Title>{plan.name}</Card.Title>
                <div className="billing-plan-price">
                  R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                  <span>/mês</span>
                </div>
                {plan.description && <Card.Text className="text-muted small">{plan.description}</Card.Text>}
                <ListGroup variant="flush" className="billing-plan-features mb-3">
                  {features.map((f) => (
                    <ListGroup.Item key={f} className="border-0 px-0 py-1 small">
                      ✓ {f}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                {showSelect && onSelect && (
                  <Button
                    variant={isHighlight ? 'primary' : 'outline-primary'}
                    className="mt-auto"
                    onClick={() => onSelect(plan.slug)}
                  >
                    Selecionar {plan.name}
                  </Button>
                )}
              </Card.Body>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
