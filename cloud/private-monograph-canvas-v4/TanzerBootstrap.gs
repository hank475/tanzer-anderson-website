const TA_CANVAS_V4_QUEUE_SHEET_ID = '1Uxr48BV65b9TfLedl6OFtxKukavbGF-0OMAGISbahzM';
const TA_CANVAS_V4_QUEUE_SHEET_NAME = 'Canvas v4 Queue';

/**
 * Tanzer Anderson one-run activation entry point.
 *
 * This still refuses to proceed unless director@tanzeranderson.com is already
 * visible to GmailApp.getAliases() as an authenticated Send mail as identity.
 */
function installPrivateMonographCanvasV4ForTanzer() {
  const installation = installPrivateMonographCanvasV4();
  const queue = configurePrivateMonographCanvasV4Queue(
    TA_CANVAS_V4_QUEUE_SHEET_ID,
    TA_CANVAS_V4_QUEUE_SHEET_NAME
  );
  return {
    installation: installation,
    queue: queue,
    status: systemStatusPrivateMonographCanvasV4(),
  };
}
