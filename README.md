# SOMA 3D · 인체 해부 뷰어

브라우저에서 돌아가는 3D 인체 해부 뷰어입니다. 피부·근육·뼈·신경·혈관·장기를 계통별·부위별로 켜고 끄고, 구조를 클릭하면 해부학 용어와 한국어 용어(새 용어·옛 용어)를 함께 보여 줍니다.

교육용이며 임상 판단에 쓰는 용도가 아닙니다. 한국어 용어는 용어집과 대조 검수를 거치지 않았습니다.

## 실행

정적 파일만으로 동작합니다. 이 폴더를 웹 서버로 열면 됩니다.

```
python -m http.server 8765
```

그런 다음 브라우저에서 `http://localhost:8765/` 를 엽니다. three.js와 글꼴은 CDN에서 불러오므로 인터넷 연결이 필요합니다.

## 출처·라이선스

- **기본 모델** (`models/bp3d`, `data/bp3d.json`): BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan. 단순화·압축본과 구조 설명은 [niuxito/human-body](https://github.com/niuxito/human-body) (CC BY-SA 4.0).
- **상세 모델** (`models/zanat`): Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0 (BodyParts3D 파생). 웹용 변환본은 [nqwrc/3d-anatomy](https://github.com/nqwrc/3d-anatomy) (CC BY-NC-SA 4.0, **비상업**). 포함된 일부 모델: "Brainder", "White matter" (University of Washington); "Cranial Nerves and Foramina" (University of Dundee, CAHID, CC-BY 4.0); "Anatomy of the Inner Ear" (University of Dundee School of Medicine, CC-BY-NC-SA 4.0); "Kidney" (lissiecowley, CC-BY-NC 4.0).
- 렌더링: three.js (MIT), meshoptimizer (MIT), Draco (Apache 2.0). 글꼴: Pretendard (SIL OFL 1.1).

상세 모델에 비상업 조건이 있으므로 이 저장소 전체는 비상업 용도로만 쓸 수 있습니다. 라이선스 원문은 `licenses` 폴더에 있습니다.
