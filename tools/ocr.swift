// Local text extraction using Apple's Vision framework.
// Preserves confidence and normalized bounds for human-reviewed imports.
import Foundation
import Vision
import ImageIO

for path in CommandLine.arguments.dropFirst() {
    do {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false
        request.recognitionLanguages = ["en-US"]
        let handler = VNImageRequestHandler(url: URL(fileURLWithPath: path))
        try handler.perform([request])
        let items: [[String: Any]] = (request.results ?? []).compactMap { observation in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            let box = observation.boundingBox
            return ["text": candidate.string, "confidence": candidate.confidence,
                    "box": [box.minX, box.minY, box.width, box.height]]
        }
        let data = try JSONSerialization.data(withJSONObject: ["path": path, "items": items], options: [.sortedKeys])
        print(String(data: data, encoding: .utf8)!)
    } catch {
        fputs("OCR failed for \(path): \(error)\n", stderr)
        exit(1)
    }
}
