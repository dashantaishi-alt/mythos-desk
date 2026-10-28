import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import './App.css'

type Scene = {
  id: string
  title: string
  text: string
  notes: string
}

type Scenario = {
  id: string
  title: string
  synopsis: string
  recommendedPlayers: string
  playTime: string
  difficulty: string
  scenes: Scene[]
}

type Resource = {
  id: string
  name: string
  type: string
  description: string
  notes: string
  scenarioId?: string
}

type Page = 'scenarios' | 'resources' | 'preview'
type PdfStyle = 'grimoire' | 'print'
type PdfKind = 'full' | 'kp'

const SCENARIOS_KEY = 'mythos-desk-scenarios'
const RESOURCES_KEY = 'mythos-desk-resources'

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

function newScene(title = '新しいシーン'): Scene {
  return { id: uid(), title, text: '', notes: '' }
}

function newScenario(): Scenario {
  return {
    id: uid(),
    title: '無題のシナリオ',
    synopsis: '',
    recommendedPlayers: '2〜4人',
    playTime: '4〜6時間',
    difficulty: '標準',
    scenes: [newScene('導入')],
  }
}

function readScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY)
    if (!raw) return [newScenario()]
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [newScenario()]

    const result = parsed.map((item: any): Scenario => ({
      id: String(item.id ?? uid()),
      title: String(item.title ?? '無題のシナリオ'),
      synopsis: String(item.synopsis ?? ''),
      recommendedPlayers: String(item.recommendedPlayers ?? ''),
      playTime: String(item.playTime ?? ''),
      difficulty: String(item.difficulty ?? '標準'),
      scenes: Array.isArray(item.scenes) && item.scenes.length
        ? item.scenes.map((scene: any): Scene => ({
            id: String(scene.id ?? uid()),
            title: String(scene.title ?? ''),
            text: String(scene.text ?? ''),
            notes: String(scene.notes ?? ''),
          }))
        : [newScene('導入')],
    }))
    return result.length ? result : [newScenario()]
  } catch {
    return [newScenario()]
  }
}

function readResources(): Resource[] {
  try {
    const raw = localStorage.getItem(RESOURCES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item: any): Resource => ({
      id: String(item.id ?? uid()),
      name: String(item.name ?? item.title ?? '無題の資料'),
      type: String(item.type ?? 'NPC'),
      description: String(item.description ?? item.text ?? ''),
      notes: String(item.notes ?? ''),
      scenarioId: item.scenarioId ? String(item.scenarioId) : undefined,
    }))
  } catch {
    return []
  }
}

const initialScenarios = readScenarios()
const initialResources = readResources()

const buttonStyle: CSSProperties = {
  border: '1px solid #51445e',
  borderRadius: 7,
  padding: '8px 12px',
  color: '#eee7f2',
  background: '#28212f',
  cursor: 'pointer',
  font: 'inherit',
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #51445e',
  borderRadius: 7,
  padding: '10px 12px',
  color: '#f1eaf5',
  background: '#17131d',
  font: 'inherit',
}

const labelStyle: CSSProperties = {
  display: 'block',
  color: '#bca9c9',
  fontSize: 12,
  marginBottom: 7,
  letterSpacing: 1,
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field" style={{ display: 'block', minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  )
}

function ScenarioDocument({
  scenario,
  resources,
  pdfStyle,
  pdfKind,
}: {
  scenario: Scenario
  resources: Resource[]
  pdfStyle: PdfStyle
  pdfKind: PdfKind
}) {
  const isFull = pdfKind === 'full'

  return (
    <article className={`print-document document-${pdfStyle}`}>
      <header className="document-cover">
        <p className="document-eyebrow">MYTHOS DESK · SCENARIO FILE</p>
        <h1>{scenario.title || '無題のシナリオ'}</h1>
        <p>{isFull ? 'SCENARIO COMPLETE EDITION' : 'KEEPER EDITION'}</p>
      </header>

      <section className="document-section">
        <h2>シナリオ概要</h2>
        <dl className="document-info">
          <div><dt>推奨プレイ人数</dt><dd>{scenario.recommendedPlayers || '未設定'}</dd></div>
          <div><dt>想定プレイ時間</dt><dd>{scenario.playTime || '未設定'}</dd></div>
          <div><dt>難易度</dt><dd>{scenario.difficulty || '未設定'}</dd></div>
        </dl>
        <h3>あらすじ・シナリオ概要</h3>
        <div className="document-body">{scenario.synopsis || '（未記入）'}</div>
      </section>

      <section className="document-section">
        <h2>シーン一覧</h2>
        {scenario.scenes.map((scene, index) => (
          <section className="document-scene" key={scene.id}>
            <h3>{String(index + 1).padStart(2, '0')}　{scene.title || '無題のシーン'}</h3>
            <div className="document-body">{scene.text || '（本文なし）'}</div>
            {(isFull || scene.notes.trim()) && (
              <div className="document-secret">
                <h4>KP用メモ・非公開情報</h4>
                <div className="document-body">{scene.notes || '（未記入）'}</div>
              </div>
            )}
          </section>
        ))}
      </section>

      <section className="document-section">
        <h2>{isFull ? '関連資料一覧' : 'KP用資料'}</h2>
        {resources.length === 0 ? <p>資料は登録されていません。</p> : resources.map(resource => (
          <section className="document-resource" key={resource.id}>
            <h3>{resource.type}：{resource.name || '無題の資料'}</h3>
            <h4>説明・公開情報</h4>
            <div className="document-body">{resource.description || '（未記入）'}</div>
            {(isFull || resource.notes.trim()) && (
              <>
                <h4>KP用メモ・秘密情報</h4>
                <div className="document-body">{resource.notes || '（未記入）'}</div>
              </>
            )}
          </section>
        ))}
      </section>
      <footer className="document-footer">MYTHOS DESK · {scenario.title}</footer>
    </article>
  )
}

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => initialScenarios)
  const [resources, setResources] = useState<Resource[]>(() => initialResources)
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(initialScenarios[0]?.id ?? null)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(initialScenarios[0]?.scenes[0]?.id ?? null)
  const [page, setPage] = useState<Page>('scenarios')
  const [resourceFilter, setResourceFilter] = useState('すべて')
  const [pdfStyle, setPdfStyle] = useState<PdfStyle>('grimoire')
  const [pdfKind, setPdfKind] = useState<PdfKind>('full')

  useEffect(() => {
    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios))
    } catch (error) {
      console.error('シナリオを保存できませんでした。', error)
    }
  }, [scenarios])

  useEffect(() => {
    try {
      localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources))
    } catch (error) {
      console.error('資料を保存できませんでした。', error)
    }
  }, [resources])

  const activeScenario = scenarios.find(scenario => scenario.id === activeScenarioId) ?? null
  const activeScene = activeScenario?.scenes.find(scene => scene.id === activeSceneId) ?? null

  const scenarioResources = useMemo(
    () => resources.filter(resource => !resource.scenarioId || resource.scenarioId === activeScenarioId),
    [resources, activeScenarioId],
  )

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setScenarios(current => current.map(scenario => scenario.id === id ? { ...scenario, ...patch } : scenario))
  }

  function updateScene(id: string, patch: Partial<Scene>) {
    if (!activeScenario) return
    updateScenario(activeScenario.id, {
      scenes: activeScenario.scenes.map(scene => scene.id === id ? { ...scene, ...patch } : scene),
    })
  }

  function createScenario() {
    const scenario = newScenario()
    setScenarios(current => [...current, scenario])
    setActiveScenarioId(scenario.id)
    setActiveSceneId(scenario.scenes[0].id)
    setPage('scenarios')
  }

  function deleteScenario(id: string) {
    if (!window.confirm('このシナリオを削除しますか？')) return
    const remaining = scenarios.filter(scenario => scenario.id !== id)
    setScenarios(remaining)
    if (activeScenarioId === id) {
      const next = remaining[0] ?? null
      setActiveScenarioId(next?.id ?? null)
      setActiveSceneId(next?.scenes[0]?.id ?? null)
    }
  }

  function addScene() {
    if (!activeScenario) return
    const scene = newScene(`シーン ${activeScenario.scenes.length + 1}`)
    updateScenario(activeScenario.id, { scenes: [...activeScenario.scenes, scene] })
    setActiveSceneId(scene.id)
  }

  function moveScene(sceneId: string, direction: -1 | 1) {
    if (!activeScenario) return
    const scenes = [...activeScenario.scenes]
    const index = scenes.findIndex(scene => scene.id === sceneId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= scenes.length) return
    ;[scenes[index], scenes[nextIndex]] = [scenes[nextIndex], scenes[index]]
    updateScenario(activeScenario.id, { scenes })
  }

  function duplicateScene(sceneId: string) {
    if (!activeScenario) return
    const index = activeScenario.scenes.findIndex(scene => scene.id === sceneId)
    if (index < 0) return
    const original = activeScenario.scenes[index]
    const copy: Scene = { ...original, id: uid(), title: `${original.title || '無題のシーン'}（コピー）` }
    const scenes = [...activeScenario.scenes]
    scenes.splice(index + 1, 0, copy)
    updateScenario(activeScenario.id, { scenes })
    setActiveSceneId(copy.id)
  }

  function deleteScene(sceneId: string) {
    if (!activeScenario) return
    if (activeScenario.scenes.length <= 1) {
      window.alert('シナリオには最低1つのシーンが必要です。')
      return
    }
    if (!window.confirm('このシーンを削除しますか？')) return
    const scenes = activeScenario.scenes.filter(scene => scene.id !== sceneId)
    updateScenario(activeScenario.id, { scenes })
    if (activeSceneId === sceneId) setActiveSceneId(scenes[0]?.id ?? null)
  }

  function addResource() {
    const resource: Resource = {
      id: uid(),
      name: '新しい資料',
      type: resourceFilter === 'すべて' ? 'NPC' : resourceFilter,
      description: '',
      notes: '',
      scenarioId: activeScenarioId ?? undefined,
    }
    setResources(current => [...current, resource])
  }

  function updateResource(id: string, patch: Partial<Resource>) {
    setResources(current => current.map(resource => resource.id === id ? { ...resource, ...patch } : resource))
  }

  function deleteResource(id: string) {
    if (!window.confirm('この資料を削除しますか？')) return
    setResources(current => current.filter(resource => resource.id !== id))
  }

  const shell: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#100d14',
    color: '#eee7f2',
    fontFamily: 'Inter, "Noto Sans JP", sans-serif',
  }
  const muted: CSSProperties = { color: '#9e90aa' }
  const panel: CSSProperties = {
    background: '#1b1622',
    border: '1px solid #382c42',
    borderRadius: 10,
    padding: 18,
    minWidth: 0,
  }
  const mainButton: CSSProperties = { ...buttonStyle, background: '#493253', borderColor: '#795d87' }

  return (
    <div style={shell}>
      <header className="app-header">
        <div>
          <div className="brand-eyebrow">OCCULT SCENARIO WORKSPACE</div>
          <div className="brand-title">MYTHOS DESK</div>
        </div>
        <nav className="app-nav">
          <button style={page === 'scenarios' ? mainButton : buttonStyle} onClick={() => setPage('scenarios')}>シナリオ編集</button>
          <button style={page === 'resources' ? mainButton : buttonStyle} onClick={() => setPage('resources')}>NPC・手がかり資料</button>
          <button style={page === 'preview' ? mainButton : buttonStyle} onClick={() => setPage('preview')}>全体表示・PDF</button>
        </nav>
      </header>

      {page === 'scenarios' ? (
        <div className="editor-layout">
          <aside style={{ ...panel, position: 'sticky', top: 12 }}>
            <div className="section-row">
              <strong>シナリオ一覧</strong>
              <button style={mainButton} onClick={createScenario}>＋</button>
            </div>
            {scenarios.map(scenario => (
              <div key={scenario.id} className={`scenario-list-card ${scenario.id === activeScenarioId ? 'selected' : ''}`}>
                <button
                  onClick={() => {
                    setActiveScenarioId(scenario.id)
                    setActiveSceneId(scenario.scenes[0]?.id ?? null)
                  }}
                  className="scenario-select"
                >{scenario.title || '無題のシナリオ'}</button>
                <div style={{ ...muted, fontSize: 12, padding: 4 }}>{scenario.scenes.length} シーン</div>
                <button style={{ ...buttonStyle, fontSize: 11, padding: '4px 7px' }} onClick={() => deleteScenario(scenario.id)}>シナリオ削除</button>
              </div>
            ))}
            <div className="sidebar-stat">
              <div style={muted}>資料数</div>
              <strong className="stat-number">{resources.length}</strong>
            </div>
          </aside>

          <main className="editor-main">
            {!activeScenario ? (
              <section style={panel}>
                <h2>シナリオがありません</h2>
                <button style={mainButton} onClick={createScenario}>新しいシナリオを作成</button>
              </section>
            ) : (
              <>
                <section style={panel}>
                  <div className="section-eyebrow">SCENARIO OVERVIEW</div>
                  <div className="overview-grid">
                    <Field label="シナリオ名">
                      <input style={inputStyle} value={activeScenario.title} onChange={e => updateScenario(activeScenario.id, { title: e.target.value })} />
                    </Field>
                    <Field label="推奨プレイ人数">
                      <input style={inputStyle} value={activeScenario.recommendedPlayers} placeholder="例：2〜4人" onChange={e => updateScenario(activeScenario.id, { recommendedPlayers: e.target.value })} />
                    </Field>
                    <Field label="想定プレイ時間">
                      <input style={inputStyle} value={activeScenario.playTime} placeholder="例：4〜6時間" onChange={e => updateScenario(activeScenario.id, { playTime: e.target.value })} />
                    </Field>
                    <Field label="難易度">
                      <select style={inputStyle} value={activeScenario.difficulty} onChange={e => updateScenario(activeScenario.id, { difficulty: e.target.value })}>
                        <option>初心者向け</option><option>標準</option><option>高難易度</option><option>熟練者向け</option><option>自由設定</option>
                      </select>
                    </Field>
                  </div>
                  <div className="field-spaced">
                    <Field label="あらすじ・シナリオ概要">
                      <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={activeScenario.synopsis} placeholder="舞台、事件の概要、シナリオの導入など" onChange={e => updateScenario(activeScenario.id, { synopsis: e.target.value })} />
                    </Field>
                  </div>
                </section>

                <section className="scene-layout">
                  <aside style={panel}>
                    <div className="section-row">
                      <strong>シーン構成</strong>
                      <button style={mainButton} onClick={addScene}>＋ 追加</button>
                    </div>
                    {activeScenario.scenes.map((scene, index) => (
                      <div key={scene.id} className={`scene-list-card ${activeSceneId === scene.id ? 'selected' : ''}`}>
                        <button onClick={() => setActiveSceneId(scene.id)} className="scene-select">
                          <span style={{ ...muted, marginRight: 8 }}>{String(index + 1).padStart(2, '0')}</span>{scene.title || '無題のシーン'}
                        </button>
                        <div className="scene-actions">
                          <button style={{ ...buttonStyle, padding: '4px 8px' }} title="上へ移動" disabled={index === 0} onClick={() => moveScene(scene.id, -1)}>↑</button>
                          <button style={{ ...buttonStyle, padding: '4px 8px' }} title="下へ移動" disabled={index === activeScenario.scenes.length - 1} onClick={() => moveScene(scene.id, 1)}>↓</button>
                          <button style={{ ...buttonStyle, padding: '4px 8px' }} onClick={() => duplicateScene(scene.id)}>複製</button>
                          <button style={{ ...buttonStyle, padding: '4px 8px', color: '#e9a6b2' }} onClick={() => deleteScene(scene.id)}>削除</button>
                        </div>
                      </div>
                    ))}
                  </aside>

                  <section style={panel}>
                    {!activeScene ? (
                      <div><p style={muted}>編集するシーンを選択してください。</p><button style={mainButton} onClick={addScene}>シーンを追加</button></div>
                    ) : (
                      <>
                        <div className="section-eyebrow">SCENE EDITOR</div>
                        <Field label="シーンタイトル">
                          <input style={inputStyle} value={activeScene.title} onChange={e => updateScene(activeScene.id, { title: e.target.value })} />
                        </Field>
                        <div className="field-spaced">
                          <Field label="本文・進行メモ">
                            <textarea className="scene-textarea" style={{ ...inputStyle, minHeight: 300, resize: 'vertical', lineHeight: 1.8 }} value={activeScene.text} placeholder="描写、NPCの台詞、判定、分岐、イベントなどを記述" onChange={e => updateScene(activeScene.id, { text: e.target.value })} />
                          </Field>
                        </div>
                        <div className="field-spaced">
                          <Field label="KP用メモ・非公開情報">
                            <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.8 }} value={activeScene.notes} placeholder="演出上の注意、裏設定、判定に失敗した場合の処理など" onChange={e => updateScene(activeScene.id, { notes: e.target.value })} />
                          </Field>
                        </div>
                      </>
                    )}
                  </section>
                </section>

                <section style={panel}>
                  <div className="section-row">
                    <div><strong>関連資料</strong><div style={{ ...muted, fontSize: 12, marginTop: 5 }}>このシナリオに紐づくNPC・手がかり</div></div>
                    <button style={mainButton} onClick={() => { setPage('resources'); setResourceFilter('すべて') }}>資料を管理</button>
                  </div>
                  <div className="resource-pills">
                    {scenarioResources.length === 0 ? <span style={muted}>まだ資料がありません。</span> : scenarioResources.map(resource => (
                      <span key={resource.id} className="resource-pill">{resource.type}：{resource.name}</span>
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      ) : page === 'resources' ? (
        <main className="resources-page">
          <section style={panel}>
            <div className="section-row">
              <div><h2 style={{ margin: '0 0 6px' }}>NPC・手がかり資料</h2><div style={muted}>シナリオ制作で使う人物・証拠・場所などを整理します。</div></div>
              <button style={mainButton} onClick={addResource}>＋ 資料を追加</button>
            </div>
            <div className="filter-row">
              {['すべて', 'NPC', '手がかり', '場所', 'アイテム', 'その他'].map(type => (
                <button key={type} style={resourceFilter === type ? mainButton : buttonStyle} onClick={() => setResourceFilter(type)}>{type}</button>
              ))}
            </div>
          </section>

          {resources.filter(resource => resourceFilter === 'すべて' || resource.type === resourceFilter).map(resource => (
            <section key={resource.id} style={panel}>
              <div className="resource-fields-grid">
                <Field label="資料名"><input style={inputStyle} value={resource.name} onChange={e => updateResource(resource.id, { name: e.target.value })} /></Field>
                <Field label="種別">
                  <select style={inputStyle} value={resource.type} onChange={e => updateResource(resource.id, { type: e.target.value })}>
                    <option>NPC</option><option>手がかり</option><option>場所</option><option>アイテム</option><option>その他</option>
                  </select>
                </Field>
              </div>
              <div className="field-spaced"><Field label="説明・公開情報"><textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={resource.description} onChange={e => updateResource(resource.id, { description: e.target.value })} /></Field></div>
              <div className="field-spaced"><Field label="KP用メモ・秘密情報"><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={resource.notes} onChange={e => updateResource(resource.id, { notes: e.target.value })} /></Field></div>
              <div className="resource-bottom-row">
                <Field label="関連シナリオ">
                  <select style={{ ...inputStyle, minWidth: 220 }} value={resource.scenarioId ?? ''} onChange={e => updateResource(resource.id, { scenarioId: e.target.value || undefined })}>
                    <option value="">共通資料</option>
                    {scenarios.map(scenario => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}
                  </select>
                </Field>
                <button style={{ ...buttonStyle, color: '#e9a6b2', alignSelf: 'end' }} onClick={() => deleteResource(resource.id)}>資料を削除</button>
              </div>
            </section>
          ))}

          {resources.filter(resource => resourceFilter === 'すべて' || resource.type === resourceFilter).length === 0 && (
            <section style={panel}><p style={muted}>この分類の資料はまだありません。</p><button style={mainButton} onClick={addResource}>最初の資料を作成</button></section>
          )}
        </main>
      ) : (
        <main className="preview-page">
          <section className="preview-controls no-print">
            <div className="preview-heading">
              <h2>シナリオ全体表示・PDF出力</h2>
              <p>編集内容をまとめて確認し、PDFとして保存できます。</p>
            </div>
            {activeScenario ? (
              <>
                <label>PDFの種類
                  <select value={pdfKind} onChange={e => setPdfKind(e.target.value as PdfKind)}>
                    <option value="full">完全版</option><option value="kp">KP用</option>
                  </select>
                </label>
                <label>PDFのデザイン
                  <select value={pdfStyle} onChange={e => setPdfStyle(e.target.value as PdfStyle)}>
                    <option value="grimoire">魔導書風</option><option value="print">印刷向け（白背景）</option>
                  </select>
                </label>
                <button style={mainButton} onClick={() => window.print()}>PDFを保存・印刷</button>
                <button style={buttonStyle} onClick={() => setPage('scenarios')}>編集画面に戻る</button>
              </>
            ) : <p>PDFにするシナリオがありません。</p>}
          </section>
          {activeScenario && <ScenarioDocument scenario={activeScenario} resources={scenarioResources} pdfStyle={pdfStyle} pdfKind={pdfKind} />}
        </main>
      )}

      <footer className="app-footer">
        <span>MYTHOS DESK · SCENARIO AUTHORING WORKSPACE</span>
        <span>変更はこのブラウザに自動保存されます</span>
      </footer>
    </div>
  )
}

