import Konva from 'konva';
import jsPDF from 'jspdf';

export const exportToImage = (stage: Konva.Stage) => {
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `floorplan-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToPDF = (stage: Konva.Stage) => {
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const pdf = new jsPDF('l', 'px', [stage.width(), stage.height()]);

    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    pdf.addImage(dataURL, 'PNG', 0, 0, width, height);
    pdf.save(`floorplan-${Date.now()}.pdf`);
};

export const shareImage = async (stage: Konva.Stage) => {
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const blob = await (await fetch(dataURL)).blob();
    const file = new File([blob], 'floorplan.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'My Floorplan',
                text: 'Check out this floorplan I created!',
                files: [file],
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        alert('Sharing is not supported on this device/browser.');
    }
};
