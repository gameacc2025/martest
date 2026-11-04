/* Smooth (Catmull-Rom -> cubic bezier) path through points [[x,y],...] */
function smooth(p) {
  var d = 'M' + p[0][0] + ',' + p[0][1];
  for (var i = 0; i < p.length - 1; i++) {
    var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
  }
  return d;
}
/* Map values to points inside a box */
function pts(vals, x0, x1, y0, y1, vmax) {
  return vals.map(function (v, i) {
    return [x0 + (x1 - x0) * i / (vals.length - 1), y1 - (y1 - y0) * v / vmax];
  });
}
