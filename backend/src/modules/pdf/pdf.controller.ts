import { Request, Response } from 'express';
import { pdfService } from './pdf.service';
import { getRouteParam } from '../../shared/utils/request.util';

export const pdfController = {
  async gerarRecibo(req: Request, res: Response) {
    const pdf = await pdfService.gerarRecibo(getRouteParam(req, 'pagamentoId'), req.empresaId!);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${getRouteParam(req, 'pagamentoId')}.pdf`);
    return res.send(pdf);
  },

  async gerarExtrato(req: Request, res: Response) {
    const contratoId = getRouteParam(req, 'contratoId');
    const pdf = await pdfService.gerarExtrato(contratoId, req.empresaId!);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=extrato-${contratoId}.pdf`);
    return res.send(pdf);
  },
};
