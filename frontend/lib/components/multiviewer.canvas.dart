import 'package:flutter/material.dart';

class MultiviewerCanvasComponent extends StatefulWidget {
  const MultiviewerCanvasComponent({super.key});

  @override
  State<MultiviewerCanvasComponent> createState() =>
      _MultiviewerCanvasComponentState();
}

enum ResizeMode { noResize, topResize, bottomResize, leftResize, rightResize }

Size screenSize = const Size(1920.0, 1080.0);

class LTWH {
  double l;
  double t;
  double w;
  double h;
  LTWH(this.l, this.t, this.w, this.h);
}

LTWH componentToScreen(Size size, Size screenSize) {
  // Calculate the aspect ratio
  double aspectRatio = screenSize.width / screenSize.height;

  // Calculate the width and height of the rectangle
  double width = size.width;
  double height = width / aspectRatio;

  // Ensure that the height does not exceed the available height
  if (height > size.height) {
    height = size.height;
    width = height * aspectRatio;
  }

  // Calculate the position to center the rectangle
  double offsetX = (size.width - width) / 2;
  double offsetY = (size.height - height) / 2;

  return LTWH(offsetX, offsetY, width, height);
}

Rect screenRectToComponentRect(LTWH ltwm, Size size, Rect rect) {
  double wpp = ltwm.w / size.width;
  double hpp = ltwm.h / size.height;

  return Rect.fromLTWH(ltwm.l + (rect.left * wpp), ltwm.t + (rect.top * hpp),
      rect.width * wpp, rect.height * wpp);
}

Offset componentPosToScreenPos(LTWH ltwm, Size size, Offset pos) {
  double wpp = ltwm.w / size.width;
  double hpp = ltwm.h / size.height;
  return Offset((pos.dx - ltwm.l) / wpp, (pos.dy - ltwm.t) / hpp);
}

Offset componentDeltaPosToScreenPos(LTWH ltwm, Size size, Offset pos) {
  double wpp = ltwm.w / size.width;
  double hpp = ltwm.h / size.height;
  return Offset(pos.dx / wpp, pos.dy / hpp);
}

class _MultiviewerCanvasComponentState
    extends State<MultiviewerCanvasComponent> {
  List<RectData> rectangles = [
    RectData(
        const Offset(50.0, 50.0), const Size(100, 100), screenSize, "Input 1"),
    RectData(const Offset(150.0, 150.0), const Size(100, 100), screenSize,
        "Input 2"),
  ];
  int selectedIndex = -1;
  ResizeMode resizeMode = ResizeMode.noResize;
  Offset? startDragPosition;
  Rect? initialRect;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      return GestureDetector(
        onPanStart: (details) {
          if (selectedIndex != -1) {
            LTWH ltwh = componentToScreen(
                Size(constraints.maxWidth, constraints.maxHeight), screenSize);

            Rect componentRect = screenRectToComponentRect(
                ltwh, screenSize, rectangles[selectedIndex].rect);

            final rect = componentRect;
            const centerRectSize = 10.0;
            final centerTop = Offset(rect.center.dx, rect.top);
            final centerTopRect = Rect.fromCenter(
                center: centerTop,
                width: centerRectSize,
                height: centerRectSize);
            final centerBottom = Offset(rect.center.dx, rect.bottom);
            final centerBottomRect = Rect.fromCenter(
                center: centerBottom,
                width: centerRectSize,
                height: centerRectSize);
            final centerLeft = Offset(rect.left, rect.center.dy);
            final centerLeftRect = Rect.fromCenter(
                center: centerLeft,
                width: centerRectSize,
                height: centerRectSize);
            final centerRight = Offset(rect.right, rect.center.dy);
            final centerRightRect = Rect.fromCenter(
                center: centerRight,
                width: centerRectSize,
                height: centerRectSize);

            if (centerTopRect.contains(details.localPosition)) {
              resizeMode = ResizeMode.topResize;
              startDragPosition = details.localPosition;
              initialRect = componentRect;
            } else if (centerBottomRect.contains(details.localPosition)) {
              resizeMode = ResizeMode.bottomResize;
              startDragPosition = details.localPosition;
              initialRect = componentRect;
            } else if (centerLeftRect.contains(details.localPosition)) {
              resizeMode = ResizeMode.leftResize;
              startDragPosition = details.localPosition;
              initialRect = componentRect;
            } else if (centerRightRect.contains(details.localPosition)) {
              resizeMode = ResizeMode.rightResize;
              startDragPosition = details.localPosition;
              initialRect = componentRect;
            } else {
              resizeMode = ResizeMode.noResize;
              startDragPosition = details.localPosition;
            }
          }
        },
        onPanUpdate: (details) {
          if (selectedIndex != -1) {
            if (resizeMode != ResizeMode.noResize) {
              // Resize the rectangle
              double newLeft = initialRect!.left;
              double newTop = initialRect!.top;
              double dx = details.localPosition.dx - startDragPosition!.dx;
              double dy = details.localPosition.dy - startDragPosition!.dy;
              double newWidth = initialRect!.width;
              double newHeight = initialRect!.height;
              if (resizeMode == ResizeMode.rightResize) {
                newWidth += dx;
              } else if (resizeMode == ResizeMode.bottomResize) {
                newHeight += dy;
              } else if (resizeMode == ResizeMode.topResize) {
                newTop += dy;
                newHeight -= dy;
              } else if (resizeMode == ResizeMode.leftResize) {
                newLeft += dx;
                newWidth -= dx;
              }

              setState(() {
                LTWH ltwh = componentToScreen(
                    Size(constraints.maxWidth, constraints.maxHeight),
                    screenSize);
                Offset newLeftTop = Offset(newLeft, newTop);
                newLeftTop =
                    componentPosToScreenPos(ltwh, screenSize, newLeftTop);
                Offset newRightBottom =
                    Offset(newLeft + newWidth, newTop + newHeight);
                newRightBottom =
                    componentPosToScreenPos(ltwh, screenSize, newRightBottom);

                rectangles[selectedIndex].size = Size(
                    newRightBottom.dx - newLeftTop.dx,
                    newRightBottom.dy - newLeftTop.dy);
                rectangles[selectedIndex].position = newLeftTop;
              });
            } else {
              // Move the rectangle
              setState(() {
                LTWH ltwh = componentToScreen(
                    Size(constraints.maxWidth, constraints.maxHeight),
                    screenSize);
                Offset delta = componentDeltaPosToScreenPos(
                    ltwh, screenSize, details.delta);
                rectangles[selectedIndex].position += delta;
              });
            }
          }
        },
        onTapDown: (details) {
          setState(() {
            LTWH ltwh = componentToScreen(
                Size(constraints.maxWidth, constraints.maxHeight), screenSize);
            for (int i = 0; i < rectangles.length; i++) {
              Rect componentRect = screenRectToComponentRect(
                  ltwh, screenSize, rectangles[i].rect);
              if (componentRect.contains(details.localPosition)) {
                selectedIndex = i;
                break;
              }
            }
          });
        },
        onTapUp: (details) {
          setState(() {
            LTWH ltwh = componentToScreen(
                Size(constraints.maxWidth, constraints.maxHeight), screenSize);
            bool deselect = true;
            for (int i = 0; i < rectangles.length; i++) {
              Rect componentRect = screenRectToComponentRect(
                  ltwh, screenSize, rectangles[i].rect);
              if (componentRect.contains(details.localPosition)) {
                deselect = false;
                break;
              }
            }
            if (deselect) {
              selectedIndex = -1;
              resizeMode = ResizeMode.noResize;
              startDragPosition = null;
            }
          });
        },
        child: CustomPaint(
          size: MediaQuery.of(context).size,
          painter: RectanglePainter(rectangles, selectedIndex),
        ),
      );
    });
  }
}

class RectanglePainter extends CustomPainter {
  final List<RectData> rectangles;
  final int selectedIndex;

  RectanglePainter(this.rectangles, this.selectedIndex);

  @override
  void paint(Canvas canvas, Size size) {
    // Paint the background in gray color
    Paint backgroundPaint = Paint()
      ..color = const Color.fromRGBO(43, 46, 56, 1);
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height), backgroundPaint);

    // rectangle
    LTWH ltwh = componentToScreen(size, screenSize);

    // Draw the black rectangle
    Paint paint = Paint()..color = Colors.black;
    canvas.drawRect(
      Rect.fromLTWH(ltwh.l, ltwh.t, ltwh.w, ltwh.h),
      paint,
    );

    // dimensions
    TextPainter hpainter = TextPainter(
      text: TextSpan(
        text: '${screenSize.width.toInt()}x${screenSize.height.toInt()}',
        style: const TextStyle(
          color: Colors.green,
          fontSize: 10.0,
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    hpainter.layout();
    hpainter.paint(canvas, Offset(ltwh.l + 5, ltwh.t + 5));

    Paint borderPaint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    Paint fillPaint = Paint()
      ..color = Colors.blue
      ..style = PaintingStyle.fill;

    Paint rectsPaint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.fill;

    for (int i = 0; i < rectangles.length; i++) {
      Rect componentRect =
          screenRectToComponentRect(ltwh, screenSize, rectangles[i].rect);

      if (i == selectedIndex) {
        fillPaint.color = Colors.red;
      } else {
        fillPaint.color = Colors.blue;
      }

      // fill
      canvas.drawRect(
        componentRect,
        fillPaint,
      );

      // border
      if (i == selectedIndex) {
        canvas.drawRect(
          componentRect,
          borderPaint,
        );
      }

      // rectangles
      if (i == selectedIndex) {
        const centerRectSize = 8.0;

        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.topCenter,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );

        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.bottomCenter,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );

        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.centerLeft,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );

        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.centerRight,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );

        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.topLeft,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );

        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.bottomLeft,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );
        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.bottomRight,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );
        canvas.drawRect(
          Rect.fromCenter(
            center: componentRect.topRight,
            width: centerRectSize,
            height: centerRectSize,
          ),
          rectsPaint,
        );

        // Draw lines
        final linePaint = Paint()..color = Colors.green;
        canvas.drawLine(componentRect.topCenter,
            Offset(componentRect.topCenter.dx, ltwh.t), linePaint);
        canvas.drawLine(componentRect.bottomCenter,
            Offset(componentRect.bottomCenter.dx, ltwh.t + ltwh.h), linePaint);
        canvas.drawLine(componentRect.centerLeft,
            Offset(ltwh.l, componentRect.centerLeft.dy), linePaint);
        canvas.drawLine(componentRect.centerRight,
            Offset(ltwh.l + ltwh.w, componentRect.centerRight.dy), linePaint);

        // Create a TextPainter object
        double distTop = componentRect.topCenter.dy - ltwh.t;
        double distRight = (ltwh.l + ltwh.w) - componentRect.centerRight.dx;
        double distLeft = componentRect.centerLeft.dx - ltwh.l;
        double distBottom = (ltwh.t + ltwh.h) - componentRect.bottomCenter.dy;
        Offset lt = componentDeltaPosToScreenPos(
            ltwh, screenSize, Offset(distLeft, distTop));
        Offset rb = componentDeltaPosToScreenPos(
            ltwh, screenSize, Offset(distRight, distBottom));

        TextPainter rpainter = TextPainter(
          text: TextSpan(
            text: '${rb.dx.toInt()} px',
            style: const TextStyle(
              color: Colors.green,
              fontSize: 10.0,
            ),
          ),
          textDirection: TextDirection.ltr,
        );

        // Layout and paint the text
        rpainter.layout();
        rpainter.paint(
            canvas,
            Offset(componentRect.centerRight.dx + 15,
                componentRect.centerRight.dy - 15));

        TextPainter tpainter = TextPainter(
          text: TextSpan(
            text: '${lt.dy.toInt()} px',
            style: const TextStyle(
              color: Colors.green,
              fontSize: 10.0,
            ),
          ),
          textDirection: TextDirection.ltr,
        );

        tpainter.layout();
        tpainter.paint(
            canvas,
            Offset(componentRect.topCenter.dx + 10,
                componentRect.topCenter.dy - 20));

        TextPainter lpainter = TextPainter(
          text: TextSpan(
            text: '${lt.dx.toInt()} px',
            style: const TextStyle(
              color: Colors.green,
              fontSize: 10.0,
            ),
          ),
          textDirection: TextDirection.ltr,
        );

        lpainter.layout();
        lpainter.paint(
            canvas,
            Offset(componentRect.centerLeft.dx - 40,
                componentRect.centerLeft.dy - 15));

        TextPainter bpainter = TextPainter(
          text: TextSpan(
            text: '${rb.dy.toInt()} px',
            style: const TextStyle(
              color: Colors.green,
              fontSize: 10.0,
            ),
          ),
          textDirection: TextDirection.ltr,
        );

        bpainter.layout();
        bpainter.paint(
            canvas,
            Offset(componentRect.bottomCenter.dx + 10,
                componentRect.bottomCenter.dy + 10));

        TextPainter spainter = TextPainter(
          text: TextSpan(
            text:
                '${rectangles[i].size.width.toInt()}x${rectangles[i].size.height.toInt()} px\n${rectangles[i].name}',
            style: const TextStyle(
              color: Colors.green,
              fontSize: 10.0,
            ),
          ),
          textDirection: TextDirection.ltr,
        );

        spainter.layout();
        spainter.paint(
            canvas, Offset(componentRect.left + 5, componentRect.top + 5));
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}

// position and size are screen coordinates
class RectData {
  Offset _position;
  Size _size;
  final String _name;
  final Size _screenSize;
  static Size minSize = const Size(30, 30);

  RectData(
      Offset initialPosition, Size initialSize, Size screenSize, this._name)
      : _position = initialPosition,
        _size = initialSize,
        _screenSize = screenSize;

  Rect get rect => Rect.fromPoints(_position,
      Offset(_position.dx + _size.width, _position.dy + _size.height));

  Size get size => _size;
  Offset get position => _position;
  String get name => _name;

  set size(Size value) {
    double width =
        value.width.clamp(minSize.width, _screenSize.width - _position.dx);
    double height =
        value.height.clamp(minSize.height, _screenSize.height - _position.dy);
    _size = Size(width, height);
  }

  set position(Offset value) {
    double dx = value.dx.clamp(0, _screenSize.width - _size.width);
    double dy = value.dy.clamp(0, _screenSize.height - _size.height);
    _position = Offset(dx, dy);
  }
}
