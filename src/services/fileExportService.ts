/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

class FileExportService {
  public downloadJson(data: object, filename: string): void {
    // Garante que o nome do arquivo termine com .json
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const fileExportService = new FileExportService();