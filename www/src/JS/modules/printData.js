import { view2, appState } from "./state.js";
import { clear, customAlert, initFocus } from "./utils.js";
import { playSuccessSound } from "./audio.js";

export function printData() {
  if (appState.isPrinting) return;
  appState.isPrinting = true;

  if (!isFormReady()) {
    appState.isPrinting = false;
    customAlert("Por favor, preencha todos os campos antes de imprimir.");
    initFocus();
    return;
  }

  if (typeof QRCode === "undefined") {
    appState.isPrinting = false;
    customAlert("Erro: Biblioteca QR Code nao carregada. Recarregue a pagina.");
    return;
  }

  playSuccessSound();

  const data = getPrintData();

  clearPrintScreen();

  if (!appState.isAuto) {
    view2.modeBtn.click();
  } else {
    initFocus();
  }

  if (window.debug) {
    console.clear();
    console.log(
      `Dados para impressao:\n data: ${data.today}\n operador: ${data.operator}\n part-number: ${data.partNumber}\n quantidade: ${data.qty}`,
    );
  }

  window.focus();

  setTimeout(async () => {
    try {
      await generatePdf(data);
      window.focus();
      clear();
      setTimeout(initFocus, 100);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      customAlert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      appState.isPrinting = false;
    }
  }, 500);
}

export async function generatePdf(data = getPrintData()) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const [qrPn, qrQty] = await Promise.all([
    createQRCodeDataUrl(data.partNumber),
    createQRCodeDataUrl(data.qty),
  ]);

  // Borda externa da etiqueta.
  doc.setLineWidth(0.4);
  doc.roundedRect(5, 5, 200, 287, 5, 5);

  // Titulo da empresa.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TOYOTA DO BRASIL", 105, 14.5, { align: "center" });

  // Faixa preta com data e hora da impressao.
  doc.setFillColor(0, 0, 0);
  doc.rect(5, 18, 200, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(data.today, 105, 29, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Campo do operador.
  doc.rect(5, 32, 200, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("OPERADOR:", 30, 39, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(data.operator, 105, 48, { align: "center" });

  // T´tulo: "PART-NUMBER"
  doc.rect(5, 52, 200, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PART NUMBER", 105, 60, { align: "center" });

  // QRcode do pn
  doc.addImage(qrPn, "PNG", 95, 65, 20, 20);

  // Part number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(140);
  doc.text(
    data.partNumber.slice(0, 5).toUpperCase(),
    105,
    data.partNumber.length > 10 ? 130 : 123,
    { align: "center" },
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.partNumber.length > 10 ? 100 : 140);
  doc.text(
    data.partNumber.slice(5).toUpperCase(),
    105,
    data.partNumber.length > 10 ? 165 : 170,
    { align: "center" },
  );

  // Titulo: Quantidade
  doc.rect(5, 178, 200, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("QUANTIDADE", 105, 186, { align: "center" });

// Quantidade
  doc.setFont("helvetica", "bold");
  doc.setFontSize(150);
  doc.text(data.qty, 105, 235, { align: "center" });
  doc.addImage(qrQty, "PNG", 95, 243, 20, 20);

  // Faixa do historico da reserva.
  doc.setFillColor(0, 0, 0);
  doc.rect(5, 270, 200, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("HISTORICO DA RESERVA", 105, 275.5, { align: "center" });

  // Linha para preenchimento manual do historico.
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    "DATA: ____/____/____             ULT OP: ______________             ULT QTD: ______________             ASS: ______________",
    105,
    287,
    { align: "center" },
  );

  await printPdfBlob(doc.output("blob"));
}

function clearPrintScreen() {
  view2.inputPN.value = "";
  view2.inputQTY.value = appState.isAuto ? "0" : "";
  view2.lastPnReaded.innerHTML = "";
}

function isFormReady() {
  if (appState.isAuto) return appState.lastPn !== "" && appState.qtyCount > 0;

  return (
    view2.inputPN.value.trim() !== "" &&
    view2.inputQTY.value.trim() !== "" &&
    view2.inputQTY.value !== "0"
  );
}

function getPrintData() {
  const operator = appState.operatorName;

  const date = new Date();

  const today = `${date.toLocaleDateString(
    "pt-BR",
  )} - ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const partNumber = appState.isAuto
    ? appState.lastPn
    : view2.inputPN.value.trim().toUpperCase().replaceAll("-", "");

  const qty = appState.isAuto
    ? String(appState.qtyCount)
    : view2.inputQTY.value.trim();

  return {
    operator,
    partNumber,
    qty,
    today,
  };
}

function printPdfBlob(blob) {
  if (window.AndroidPrint?.printPdf) {
    return printAndroidPdf(blob);
  }

  return printBrowserPdf(blob);
}

function printAndroidPdf(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const base64Pdf = reader.result.split(",")[1];
      window.AndroidPrint.printPdf(base64Pdf);
      setTimeout(() => {
        window.focus();
        resolve();
      }, 500);
    };

    reader.readAsDataURL(blob);
  });
}

function printBrowserPdf(blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");

  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });

  iframe.src = url;
  document.body.appendChild(iframe);

  return new Promise((resolve, reject) => {
    iframe.onerror = reject;

    iframe.onload = () => {
      const printWindow = iframe.contentWindow;
      let isCleaned = false;

      const clean = () => {
        if (isCleaned) return;
        isCleaned = true;
        window.removeEventListener("afterprint", clean);
        window.removeEventListener("focus", clean);

        try {
          printWindow.onafterprint = null;
          printWindow.stop();
        } catch (error) {
          console.warn("Nao foi possivel parar o iframe de impressao:", error);
        }

        URL.revokeObjectURL(url);
        iframe.remove();
        window.focus();
        resolve();
      };

      window.addEventListener("afterprint", clean, { once: true });
      printWindow.onafterprint = clean;
      printWindow.focus();
      printWindow.print();

      setTimeout(
        () => window.addEventListener("focus", clean, { once: true }),
        500,
      );
    };
  });
}

async function createQRCodeDataUrl(data) {
  const container = document.createElement("div");

  Object.assign(container.style, {
    position: "fixed",
    left: "-9999px",
    top: "-9999px",
    width: "256px",
    height: "256px",
  });

  document.body.appendChild(container);

  try {
    new QRCode(container, {
      text: data,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = container.querySelector("canvas");
    if (canvas) return canvas.toDataURL("image/png");

    const image = container.querySelector("img");
    if (image?.src) return image.src;

    throw new Error("QRCode nao gerou imagem.");
  } finally {
    container.remove();
  }
}
