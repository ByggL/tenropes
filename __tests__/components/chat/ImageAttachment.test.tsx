import React from "react";
import { act, create } from "react-test-renderer";
import { ActivityIndicator, Image } from "react-native";

import ImageAttachment from "@/components/chat/ImageAttachment";

function render(el: React.ReactElement) {
  let r: any;
  act(() => {
    r = create(el);
  });
  return r;
}

describe("components/chat/ImageAttachment.tsx", () => {
  afterEach(() => jest.restoreAllMocks());

  it("shows a loader while dimensions are being resolved", () => {
    // getSize never invokes its callbacks -> loading stays true
    jest.spyOn(Image, "getSize").mockImplementation(() => {});
    const r = render(<ImageAttachment uri="http://img/a.png" baseStyle={{}} />);
    expect(r.root.findAllByType(ActivityIndicator).length).toBe(1);
  });

  it("renders the image with computed dimensions after a successful getSize", () => {
    jest.spyOn(Image, "getSize").mockImplementation((_uri: any, success: any) => {
      success(200, 100); // aspectRatio 2 -> height 180
    });
    let r: any;
    act(() => {
      r = create(<ImageAttachment uri="http://img/a.png" baseStyle={{ borderRadius: 4 }} />);
    });
    const img = r.root.findAllByType(Image)[0];
    const flat = [].concat(...[].concat(img.props.style));
    const sizeStyle = flat.find((s: any) => s && s.height === 180);
    expect(sizeStyle).toMatchObject({ width: 360, height: 180 });
  });

  it("stops loading and keeps default dimensions when getSize errors", () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(Image, "getSize").mockImplementation((_uri: any, _success: any, error: any) => {
      error(new Error("boom"));
    });
    let r: any;
    act(() => {
      r = create(<ImageAttachment uri="http://img/broken.png" baseStyle={{}} />);
    });
    expect(errSpy).toHaveBeenCalled();
    // Default dims (360x200) preserved, image still rendered (not the loader)
    expect(r.root.findAllByType(ActivityIndicator).length).toBe(0);
    const img = r.root.findAllByType(Image)[0];
    const flat = [].concat(...[].concat(img.props.style));
    expect(flat.find((s: any) => s && s.height === 200)).toMatchObject({ width: 360, height: 200 });
  });
});
