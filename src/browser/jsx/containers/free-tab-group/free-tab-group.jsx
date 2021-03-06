import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import TabbedPane from '../../components/tabs/tabbed-pane.js';
import TabbedPaneItem from '../../components/tabs/tabbed-pane-item.js';
import DatabaseViewer from '../database-viewer/database-viewer';
import DocumentTerminalViewer from '../document-terminal-viewer/document-terminal-viewer';
import SearchTextBox from '../../components/search-text-box/search-text-box.jsx';
import GlobalHistoryViewer from '../global-history-viewer/global-history-viewer';
import PlotViewer from '../plot-viewer/plot-viewer.jsx';
import FileViewer from '../file-viewer/file-viewer.jsx';
import VariableViewer from '../../components/variable-viewer/variable-viewer.jsx';
import VariableTableViewer from '../variable-table-viewer.jsx';
import PackageViewer from '../package-viewer/package-viewer.jsx';
import PackageSearchViewer from '../package-search-viewer/package-search-viewer.jsx';
import BlockTerminalViewer from '../block-terminal-viewer/block-terminal-viewer';
import ActionestButton from '../../components/actionest/actionest-button';
import {getParentNodeOf} from '../../services/dom';
import freeTabActions from './free-tab-group.actions';
import documentTerminalViewerActions from '../document-terminal-viewer/document-terminal-viewer.actions';
import promptViewerActions from '../prompt-viewer/prompt-viewer.actions';
import terminalViewerActions from '../block-terminal-viewer/block-terminal-viewer.actions';
import historyViewerActions from '../history-viewer/history-viewer.actions';
import plotViewerActions from '../plot-viewer/plot-viewer.actions';
import packageSearchActions from '../package-search-viewer/package-search-viewer.actions';
import kernelActions from '../../actions/kernel';
import commonReact from '../../services/common-react';

const allowedPopoutTypes = [
  'global-history-viewer',
  'plot-viewer',
  'variable-viewer'
];

/**
 * @param {object} props
 * @returns {boolean}
 */
function isPopoutAllowed(props) {
  const activeIndex = _.findIndex(props.tabs, {id: props.active});

  if (activeIndex > -1) {
    const contentType = props.tabs[activeIndex].contentType;

    return allowedPopoutTypes.indexOf(contentType) > -1;
  }

  return false;
}

/**
 * @param {function} dispatch
 * @param {object} ownProps  Props given to this object from parent
 * @returns {object}
 */
function mapDispatchToProps(dispatch, ownProps) {
  const groupId = ownProps.groupId;

  return {
    onAutocomplete: (id, props) => dispatch(promptViewerActions.autocomplete(groupId, id, props)),
    onAnnotationClick: (id, props) => dispatch(documentTerminalViewerActions.clickAnnotation(groupId, id, props)),
    onAnnotationCopy: (id, event) => dispatch(documentTerminalViewerActions.copyAnnotation(groupId, id, event)),
    onBlockRemove: (id, blockId) => dispatch(historyViewerActions.createBlockRemove(groupId, id, blockId)),
    onCloseTab: id => dispatch(freeTabActions.closeTab(groupId, id)),
    onCopyToPrompt: (id, props) => dispatch(promptViewerActions.copyToPrompt(groupId, id, props)),
    onDocumentTerminalAutocomplete: (id, props) => dispatch(documentTerminalViewerActions.autocomplete(groupId, id, props)),
    onDocumentTerminalPromptExecute: (id, context) => dispatch(documentTerminalViewerActions.execute(groupId, id, context)),
    onDocumentTerminalPromptInput: (id, context) => dispatch(documentTerminalViewerActions.input(groupId, id, context)),
    onDocumentTerminalHistoryClear: id => dispatch(documentTerminalViewerActions.clear(groupId, id)),
    onDocumentTerminalInstallPythonModule: (id, name, version) =>
      dispatch(documentTerminalViewerActions.installPythonModule(groupId, id, name, version)),
    onDocumentTerminalInstallPythonModuleExternally: (id, name, version) =>
      dispatch(documentTerminalViewerActions.installPythonModuleExternally(groupId, id, name, version)),
    onHistoryBlockContract: (id, blockId, itemId) => dispatch(historyViewerActions.createContract(groupId, id, blockId, itemId)),
    onHistoryBlockExpand: (id, blockId, itemId) => dispatch(historyViewerActions.createExpand(groupId, id, blockId, itemId)),
    onHistoryBlockSave: (id, blockId, itemId, data) => dispatch(freeTabActions.saveData(data)),
    onPackageSearchPythonModule: (id, name, version) => dispatch(packageSearchActions.installPackage(groupId, id, name, version)),
    onPackageSearchShowMore: (id, packageName, version) => dispatch(packageSearchActions.showMore(groupId, id, packageName, version)),
    onPackageSearchList: id => dispatch(packageSearchActions.list(groupId, id)),
    onPackageSearchValueChange: (id, value) => dispatch(packageSearchActions.changeSearchValue(groupId, id, value)),
    onPackageSearchByTerm: (id, term) => dispatch(packageSearchActions.searchByTerm(groupId, id, term)),
    onPromptCommand: (id, command) => dispatch(promptViewerActions.createCommand(groupId, id, command)),
    onPromptExecute: (id, context) => dispatch(terminalViewerActions.execute(groupId, id, context)),
    onPromptInput: (id, context) => dispatch(terminalViewerActions.input(groupId, id, context)),
    onFocusTab: id => dispatch(freeTabActions.focusTab(groupId, id)),
    onMoveTab: context => dispatch(freeTabActions.moveTab(context)),
    onMount: () => dispatch(kernelActions.detectKernelVariables()),
    onOpenExternal: url => dispatch(freeTabActions.openExternal(url)),
    onPopActiveTab: () => dispatch(freeTabActions.popActiveTab(groupId)),
    onInstallPythonModule: (id, moduleName) => dispatch(terminalViewerActions.installPythonModule(groupId, id, moduleName)),
    onShowDataFrame: item => dispatch(freeTabActions.showDataFrame(groupId, item)),
    onFocusPlot: (id, plot) => dispatch(plotViewerActions.focus(groupId, id, plot)),
    onReRunHistoryBlock: (id, blockId) => dispatch(terminalViewerActions.reRunHistoryBlock(groupId, id, blockId)),
    onRemovePlot: (id, plot) => dispatch(plotViewerActions.remove(groupId, id, plot)),
    onTerminalInterrupt: id => dispatch(documentTerminalViewerActions.interrupt(groupId, id)),
    onTerminalRestart: id => dispatch(documentTerminalViewerActions.restart(groupId, id)),
    onSavePlot: plot => dispatch(freeTabActions.savePlot(plot)),
    onShowSelectWorkingDirectoryDialog: id => dispatch(documentTerminalViewerActions.showSelectWorkingDirectoryDialog(groupId, id))
  };
}

export default connect(null, mapDispatchToProps)(React.createClass({
  displayName: 'FreeTabGroup',
  propTypes: {
    active: React.PropTypes.string.isRequired,
    disabled: React.PropTypes.bool,
    groupId: React.PropTypes.string.isRequired,
    tabs: React.PropTypes.array.isRequired
  },
  getInitialState: function () {
    return {searchFilter: ''};
  },
  componentDidMount() {
    this.props.onMount();
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return commonReact.shouldComponentUpdate(this, nextProps, nextState);
  },
  handleTabClick: function (id, event) {
    event.preventDefault();
    this.props.onFocusTab(id);
  },
  handleTabClose: function (id, event) {
    event.preventDefault();
    this.props.onCloseTab(id);
  },
  /**
   * NOTE: preventDefault to reject drag
   * @param {string} id
   * @param {DragEvent} event
   */
  handleTabDragStart: function (id, event) {
    const props = this.props,
      tab = _.find(this.props.tabs, {id}),
      sourceGroupId = props.groupId;

    if (tab) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('rodeo/free-tab', JSON.stringify({sourceGroupId, tab}));
    } else {
      // prevent default in this case means to _deny_ the start of the drag
      event.preventDefault();
    }
  },
  /**
   * NOTE: preventDefault to allow drop
   * @param {DragEvent} event
   */
  handleTabListDragOver: function (event) {
    const itemStr = event.dataTransfer.getData('rodeo/free-tab');

    // NOTE that chrome only allows reading of data in the Drop event, so we only check for existence
    if (_.isString(itemStr)) {
      event.preventDefault();
    }
  },
  handleTabListDragEnter: function (event) {
    // accept all
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  },
  handleTabListDragLeave: function (event) {
    console.log('handleTabListDragLeave', event);
  },
  handleTabListDrop: function (event) {
    const props = this.props,
      tabStr = event.dataTransfer.getData('rodeo/free-tab'),
      destinationGroupId = props.groupId;
    let context;

    if (_.isString(tabStr)) {
      try {
        context = _.assign({destinationGroupId}, JSON.parse(tabStr));

        props.onMoveTab(context);
      } catch (ex) {
        console.log(ex);
      }
    }
  },
  handleTabDragEnd: function (event) {
    console.log('handleTabDragEnd', event);
  },
  render: function () {
    const props = this.props,
      state = this.state,
      filter = state.searchFilter,
      types = {
        'block-terminal-viewer': tab => (
          <BlockTerminalViewer
            filter={filter}
            onAutocomplete={_.partial(props.onAutocomplete, tab.id)}
            onBlockRemove={_.partial(props.onBlockRemove, tab.id)}
            onCommand={_.partial(props.onPromptCommand, tab.id)}
            onContract={_.partial(props.onHistoryBlockContract, tab.id)}
            onCopyToPrompt={_.partial(props.onCopyToPrompt, tab.id)}
            onExecute={_.partial(props.onPromptExecute, tab.id)}
            onExpand={_.partial(props.onHistoryBlockExpand, tab.id)}
            onInput={_.partial(props.onPromptInput, tab.id)}
            onInstallPythonModule={_.partial(props.onInstallPythonModule, tab.id)}
            onReRun={_.partial(props.onReRunHistoryBlock, tab.id)}
            onSave={_.partial(props.onHistoryBlockSave, tab.id)}
            {...tab.content}
          />
        ),
        'database-viewer': tab => (
          <DatabaseViewer
            filter={filter}
            groupId={props.groupId}
            id={tab.id}
            {...tab.content}
          />
        ),
        'document-terminal-viewer': tab => (
          <DocumentTerminalViewer
            filter={filter}
            onAnnotationClick={_.partial(props.onAnnotationClick, tab.id)}
            onAnnotationCopy={_.partial(props.onAnnotationCopy, tab.id)}
            onClear={_.partial(props.onDocumentTerminalHistoryClear, tab.id)}
            onInstallPythonModule={_.partial(props.onInstallPythonModule, tab.id)}
            onInterrupt={_.partial(props.onTerminalInterrupt, tab.id)}
            onPromptAutocomplete={_.partial(props.onDocumentTerminalAutocomplete, tab.id)}
            onPromptCommand={_.partial(props.onPromptCommand, tab.id)}
            onPromptExecute={_.partial(props.onDocumentTerminalPromptExecute, tab.id)}
            onPromptInput={_.partial(props.onDocumentTerminalPromptInput, tab.id)}
            onRestart={_.partial(props.onTerminalRestart, tab.id)}
            onShowSelectWorkingDirectoryDialog={_.partial(props.onShowSelectWorkingDirectoryDialog, tab.id)}
            {...tab.content}
          />
        ),
        'global-history-viewer': tab => (
          <GlobalHistoryViewer
            filter={filter}
            onBlockRemove={_.partial(props.onBlockRemove, tab.id)}
            onContract={_.partial(props.onHistoryBlockContract, tab.id)}
            onExpand={_.partial(props.onHistoryBlockExpand, tab.id)}
            onInstallPythonModule={_.partial(props.onInstallPythonModule, tab.id)}
            onSave={_.partial(props.onHistoryBlockSave, tab.id)}
            {...tab.content}
          />
        ),
        'file-viewer': tab => <FileViewer filter={filter} {...tab.content}/>,
        'package-search-viewer': tab => (
          <PackageSearchViewer
            filter={filter}
            onInstallPythonModule={_.partial(props.onPackageSearchPythonModule, tab.id)}
            onList={_.partial(props.onPackageSearchList, tab.id)}
            onOpenExternal={props.onOpenExternal}
            onSearchByTerm={_.partial(props.onPackageSearchByTerm, tab.id)}
            onSearchValueChange={_.partial(props.onPackageSearchValueChange, tab.id)}
            onShowMore={_.partial(props.onPackageSearchShowMore, tab.id)}
            {...tab.content}
          />),
        'package-viewer': tab => <PackageViewer filter={filter} {...tab.content}/>,
        'plot-viewer': tab => (
          <PlotViewer
            onFocusPlot={_.partial(props.onFocusPlot, tab.id)}
            onRemovePlot={_.partial(props.onRemovePlot, tab.id)}
            onSavePlot={props.onSavePlot}
            {...tab.content}
          />
        ),
        'variable-viewer': tab => (
          <VariableViewer
            filter={filter}
            onShowDataFrame={props.onShowDataFrame}
            visible={tab.id === props.active}
            {...tab.content}
          />
        ),
        'variable-table-viewer': tab => (
          <VariableTableViewer
            filter={filter}
            visible={tab.id === props.active}
            {...tab.content}
          />
        )
      };
    let popoutButton;

    if (isPopoutAllowed(props)) {
      popoutButton = <ActionestButton icon="expand" onClick={props.onPopActiveTab}/>;
    } else {
      popoutButton = <ActionestButton className="disabled" icon="expand"/>;
    }

    return (
      <TabbedPane
        filter={filter}
        onTabClick={this.handleTabClick}
        onTabClose={this.handleTabClose}
        onTabDragEnd={this.handleTabDragEnd}
        onTabDragStart={this.handleTabDragStart}
        onTabListDragEnter={this.handleTabListDragEnter}
        onTabListDragLeave={this.handleTabListDragLeave}
        onTabListDragOver={this.handleTabListDragOver}
        onTabListDrop={this.handleTabListDrop}
        {...props}
      >
        <li className="right">{popoutButton}</li>
        <li className="right">
          <SearchTextBox onChange={searchFilter => this.setState({searchFilter})}/>
        </li>
        {props.tabs.map(tab => (
          <TabbedPaneItem filter={filter} key={tab.id} {...tab}>
            {_.isFunction(types[tab.contentType]) ? types[tab.contentType](tab) : `Not a known tab type: ${tab.contentType}`}
          </TabbedPaneItem>
        ))}
      </TabbedPane>
    );
  }
}));
